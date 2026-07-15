<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $with = ['attributeValues.attribute', 'stockBatches'];

    protected $fillable = [
        'product_id',
        'variant_sku',
        'variant_name',
        'region_code',
        'currency_code',
        'purchase_price',
        'retail_price',
        'compare_at_price',
        'stock_qty',
        'low_stock_threshold',
        'created_by',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:4',
        'retail_price' => 'decimal:4',
        'compare_at_price' => 'decimal:4',
        'stock_qty' => 'integer',
        'low_stock_threshold' => 'integer',
    ];

    protected static function booted()
    {
        static::created(function ($variant) {
            // Create initial batch if stock is greater than 0
            if ($variant->stock_qty > 0) {
                $variant->stockBatches()->create([
                    'initial_qty' => $variant->stock_qty,
                    'remaining_qty' => $variant->stock_qty,
                    'purchase_price' => $variant->purchase_price ?? 0.0000,
                ]);
            }
        });

        static::updating(function ($variant) {
            if ($variant->isDirty('stock_qty')) {
                $oldQty = $variant->getOriginal('stock_qty') ?? 0;
                $newQty = $variant->stock_qty ?? 0;
                $diff = $newQty - $oldQty;

                if ($diff > 0) {
                    // Restock / Return Stock: Create a new batch for the added quantity
                    $variant->stockBatches()->create([
                        'initial_qty' => $diff,
                        'remaining_qty' => $diff,
                        'purchase_price' => $variant->purchase_price ?? 0.0000,
                    ]);
                } elseif ($diff < 0) {
                    // Sale / Deduction: Deduct from oldest batches first (FIFO)
                    $toDeduct = abs($diff);
                    
                    $batches = $variant->stockBatches()
                        ->where('remaining_qty', '>', 0)
                        ->orderBy('created_at', 'asc')
                        ->orderBy('id', 'asc')
                        ->get();

                    foreach ($batches as $batch) {
                        if ($toDeduct <= 0) {
                            break;
                        }

                        if ($batch->remaining_qty >= $toDeduct) {
                            $batch->decrement('remaining_qty', $toDeduct);
                            $toDeduct = 0;
                        } else {
                            $toDeduct -= $batch->remaining_qty;
                            $batch->update(['remaining_qty' => 0]);
                        }
                    }

                    // Fallback for negative stock / over-deduction
                    if ($toDeduct > 0) {
                        $latestBatch = $variant->stockBatches()->orderBy('created_at', 'desc')->first();
                        if ($latestBatch) {
                            $latestBatch->decrement('remaining_qty', $toDeduct);
                        } else {
                            $variant->stockBatches()->create([
                                'initial_qty' => 0,
                                'remaining_qty' => -$toDeduct,
                                'purchase_price' => $variant->purchase_price ?? 0.0000,
                            ]);
                        }
                    }
                }
            }
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attributeValues()
    {
        return $this->belongsToMany(ProductAttributeValue::class, 'product_variant_attribute_values', 'product_variant_id', 'product_attribute_value_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(ProductVariantStockBatch::class, 'product_variant_id');
    }
}
