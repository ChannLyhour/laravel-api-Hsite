import { categoriesService } from '@/api/owner/categories';
import { attributesService } from '@/api/owner/product';

interface AutoSetupCategory {
     name: string;
     description: string;
     subCategories?: AutoSetupSubCategory[];
}

interface AutoSetupSubCategory {
     name: string;
     description: string;
     subSubCategories?: string[];
}

interface AutoSetupAttribute {
     name: string;
     values: string[];
}

interface StoreStaticData {
     categories: AutoSetupCategory[];
     attributes: AutoSetupAttribute[];
}

const beautyData: StoreStaticData = {
     categories: [
          {
               name: 'Makeup',
               description: 'Cosmetics for eyes, face and lips',
               subCategories: [
                    {
                         name: 'Lips',
                         description: 'Lipsticks, tints and glosses',
                         subSubCategories: ['Matte Lipstick', 'Hydrating Lip Gloss']
                    }
               ]
          },
          {
               name: 'Skincare',
               description: 'Creams, serums and cleansers',
               subCategories: [
                    {
                         name: 'Moisturizers',
                         description: 'Gels, lotions and body oils',
                         subSubCategories: ['Hyaluronic Gel Cream', 'Daily Sunscreen SPF50']
                    }
               ]
          }
     ],
     attributes: [
          { name: 'Shade/Tone', values: ['Light 10', 'Medium 20', 'Tan 30', 'Deep 40'] },
          { name: 'Volume', values: ['30ml', '50ml', '100ml'] }
     ]
};

const staticDataByStoreType: Record<string, StoreStaticData> = {
     restaurant: {
          categories: [
               {
                    name: 'Appetizers',
                    description: 'Starters, soups, salads and light bites',
                    subCategories: [
                         {
                              name: 'Soups',
                              description: 'Freshly prepared warm soups',
                              subSubCategories: ['Tom Yum Soup', 'Pumpkin Soup']
                         },
                         {
                              name: 'Salads',
                              description: 'Healthy and fresh green salads',
                              subSubCategories: ['Caesar Salad', 'Greek Salad']
                         }
                    ]
               },
               {
                    name: 'Main Courses',
                    description: 'Hearty mains featuring meat, poultry and seafood',
                    subCategories: [
                         {
                              name: 'Beef & Pork',
                              description: 'Grilled steaks and tender ribs',
                              subSubCategories: ['Ribeye Steak', 'Pork Ribs']
                         },
                         {
                              name: 'Seafood',
                              description: 'Fresh local seafood catches',
                              subSubCategories: ['Fried Fish', 'Steamed Shrimp']
                         }
                    ]
               },
               {
                    name: 'Desserts',
                    description: 'Sweet treats, ice cream and cakes',
                    subCategories: [
                         {
                              name: 'Ice Cream',
                              description: 'Artisan scoops and sundaes',
                              subSubCategories: ['Vanilla Scoop', 'Chocolate Fudge']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Spice Level', values: ['Mild', 'Medium', 'Spicy', 'Extra Spicy'] },
               { name: 'Portion Size', values: ['Regular', 'Large'] },
               { name: 'Extra Toppings', values: ['Extra Cheese', 'Add Egg', 'Extra Sauce'] }
          ]
     },
     cafe: {
          categories: [
               {
                    name: 'Hot Coffee',
                    description: 'Warm espresso drinks and brews',
                    subCategories: [
                         {
                              name: 'Espresso',
                              description: 'Pure shot extractions',
                              subSubCategories: ['Single Espresso', 'Double Espresso']
                         },
                         {
                              name: 'Latte & Cappuccino',
                              description: 'Smooth milk and microfoam beverages',
                              subSubCategories: ['Cafe Latte', 'Vanilla Cappuccino']
                         }
                    ]
               },
               {
                    name: 'Iced Coffee',
                    description: 'Chilled refreshing coffee treats',
                    subCategories: [
                         {
                              name: 'Iced Latte',
                              description: 'Espresso over cold milk and ice',
                              subSubCategories: ['Caramel Iced Latte', 'Hazelnut Iced Latte']
                         }
                    ]
               },
               {
                    name: 'Pastries',
                    description: 'Freshly baked croissants and sweet goods',
                    subCategories: [
                         {
                              name: 'Croissants',
                              description: 'Flaky buttery croissants',
                              subSubCategories: ['Butter Croissant', 'Chocolate Croissant']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Sweetness Level', values: ['No Sugar (0%)', 'Less Sweet (50%)', 'Normal Sweet (100%)', 'Extra Sweet (120%)'] },
               { name: 'Ice Level', values: ['No Ice', 'Less Ice', 'Normal Ice'] },
               { name: 'Milk Type', values: ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk'] }
          ]
     },
     bakery: {
          categories: [
               {
                    name: 'Bread',
                    description: 'Daily fresh-baked artisan breads',
                    subCategories: [
                         {
                              name: 'Sourdough',
                              description: 'Natural yeast crusty loaves',
                              subSubCategories: ['Classic Sourdough', 'Whole Wheat Sourdough']
                         }
                    ]
               },
               {
                    name: 'Cakes',
                    description: 'Celebration cakes and single portions',
                    subCategories: [
                         {
                              name: 'Birthday Cakes',
                              description: 'Decorated whole party cakes',
                              subSubCategories: ['Chocolate Ganache Cake', 'Rainbow Fruit Cake']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Cake Size', values: ['6 inch', '8 inch', '10 inch'] },
               { name: 'Flavor', values: ['Chocolate', 'Vanilla', 'Strawberry', 'Red Velvet'] }
          ]
     },
     fast_food: {
          categories: [
               {
                    name: 'Burgers',
                    description: 'Flamed-grilled patties and combos',
                    subCategories: [
                         {
                              name: 'Beef Burgers',
                              description: '100% Angus beef burgers',
                              subSubCategories: ['Cheeseburger', 'Double Bacon Cheeseburger']
                         }
                    ]
               },
               {
                    name: 'Fried Chicken',
                    description: 'Crispy crunchy fried chicken',
                    subCategories: [
                         {
                              name: 'Chicken Wings',
                              description: 'Spicy glazed wings',
                              subSubCategories: ['Buffalo Wings', 'BBQ Wings']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Meal Size', values: ['Single Item', 'Regular Combo', 'Large Combo'] },
               { name: 'Dipping Sauce', values: ['Ketchup', 'Chili Sauce', 'BBQ Sauce', 'Cheese Sauce'] }
          ]
     },
     bar: {
          categories: [
               {
                    name: 'Cocktails',
                    description: 'Premium mixology and drinks',
                    subCategories: [
                         {
                              name: 'Signature Cocktails',
                              description: 'Unique custom recipes',
                              subSubCategories: ['BiteFlow Mule', 'Siem Reap Sunrise']
                         }
                    ]
               },
               {
                    name: 'Beers',
                    description: 'Cold drafts and craft bottles',
                    subCategories: [
                         {
                              name: 'Draft Beers',
                              description: 'Fresh from the tap',
                              subSubCategories: ['Local Lager', 'IPA Craft Draft']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Preparation', values: ['Neat', 'On the Rocks', 'With Mixer'] },
               { name: 'Mixer Choice', values: ['Tonic Water', 'Soda', 'Coke', 'Ginger Ale'] }
          ]
     },
     fashion: {
          categories: [
               {
                    name: "Men's Clothing",
                    description: 'T-shirts, shirts and pants',
                    subCategories: [
                         {
                              name: 'Shirts & T-Shirts',
                              description: 'Casual and smart shirts',
                              subSubCategories: ['Crewneck Tee', 'Slim Fit Polo']
                         }
                    ]
               },
               {
                    name: "Women's Clothing",
                    description: 'Dresses, blouses and skirts',
                    subCategories: [
                         {
                              name: 'Dresses',
                              description: 'Cocktail, summer and maxi dresses',
                              subSubCategories: ['Floral Summer Dress', 'Classic Black Dress']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
               { name: 'Color', values: ['Black', 'White', 'Navy Blue', 'Red', 'Gray', 'Beige'] }
          ]
     },
     electronics: {
          categories: [
               {
                    name: 'Smartphones',
                    description: 'Latest models and tech',
                    subCategories: [
                         {
                              name: 'iOS Devices',
                              description: 'Apple iPhones and tablets',
                              subSubCategories: ['iPhone Pro', 'iPad Air']
                         }
                    ]
               },
               {
                    name: 'Accessories',
                    description: 'Cables, cases and powerbanks',
                    subCategories: [
                         {
                              name: 'Chargers & Cables',
                              description: 'Fast chargers and USB cords',
                              subSubCategories: ['USB-C Fast Cable', 'Wireless Charger Pad']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Storage Capacity', values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
               { name: 'Warranty Period', values: ['No Warranty', '6 Months', '1 Year', '2 Years'] }
          ]
     },
     beauty: beautyData,
     shop_beauty: beautyData,
     shop_beauti: beautyData,
     gifts: {
          categories: [
               {
                    name: 'Home Decor',
                    description: 'Vases, candles and cozy decorations',
                    subCategories: [
                         {
                              name: 'Candles',
                              description: 'Scented soy wax candles',
                              subSubCategories: ['Lavender Scented Candle', 'Vanilla Amber Candle']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Gift Wrapping', values: ['Standard Wrap', 'Premium Wrapping Box', 'Luxury Wooden Box'] },
               { name: 'Greeting Card', values: ['None', 'Thank You Card', 'Birthday Card', 'Custom Note'] }
          ]
     },
     supermarket: {
          categories: [
               {
                    name: 'Fresh Produce',
                    description: 'Healthy fruits and vegetables',
                    subCategories: [
                         {
                              name: 'Fruits',
                              description: 'Fresh local and imported fruits',
                              subSubCategories: ['Bananas', 'Apples', 'Oranges']
                         }
                    ]
               },
               {
                    name: 'Dairy & Eggs',
                    description: 'Fresh milk, cheese and poultry eggs',
                    subCategories: [
                         {
                              name: 'Milk',
                              description: 'Organic and plant milks',
                              subSubCategories: ['Whole Fresh Milk', 'Unsweetened Soy Milk']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Weight/Unit', values: ['250g', '500g', '1kg', 'Pack of 6', 'Pack of 12'] }
          ]
     },
     minimart: {
          categories: [
               {
                    name: 'Snacks & Chips',
                    description: 'Crisps, cookies and sweet snacks',
                    subCategories: [
                         {
                              name: 'Potato Chips',
                              description: 'Crunchy potato crisps',
                              subSubCategories: ['Classic Salted Chips', 'Spicy BBQ Chips']
                         }
                    ]
               },
               {
                    name: 'Beverages',
                    description: 'Sodas, energy drinks and water',
                    subCategories: [
                         {
                              name: 'Soft Drinks',
                              description: 'Carbonated soda pop cans',
                              subSubCategories: ['Cola Soda Can', 'Lemon-Lime Soda Can']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Packaging Size', values: ['Single Can/Bottle', 'Pack of 6', 'Case of 24'] },
               { name: 'Temperature', values: ['Chilled (Cold)', 'Room Temperature'] }
          ]
     },
     handmade: {
          categories: [
               {
                    name: 'Jewelry',
                    description: 'Handmade artisan earrings, necklaces and rings',
                    subCategories: [
                         {
                              name: 'Necklaces',
                              description: 'Pendants and beaded necklaces',
                              subSubCategories: ['Silver Pendant Necklace', 'Boho Beaded Choker']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Metal Type', values: ['Sterling Silver', '14k Gold Plated', 'Copper/Brass'] },
               { name: 'Custom Engraving', values: ['No Engraving', 'Engrave Initials (+$3.00)', 'Engrave Full Name (+$5.00)'] }
          ]
     },
     digital: {
          categories: [
               {
                    name: 'Templates & Software',
                    description: 'UI kits, Excel models and web templates',
                    subCategories: [
                         {
                              name: 'Web Templates',
                              description: 'Vite and React landing page templates',
                              subSubCategories: ['SaaS Portfolio Template', 'Restaurant Delivery Theme']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'License Type', values: ['Personal Use', 'Commercial License (+$10)', 'Extended Enterprise (+$50)'] },
               { name: 'File Format', values: ['Figma File', 'PDF Document', 'ZIP Source Code'] }
          ]
     },
     service_other: {
          categories: [
               {
                    name: 'Consulting',
                    description: 'Expert advice and strategy sessions',
                    subCategories: [
                         {
                              name: 'Business Strategy',
                              description: '1-on-1 advisor calls',
                              subSubCategories: ['30min Setup Consultation', '60min Strategy Review']
                         }
                    ]
               }
          ],
          attributes: [
               { name: 'Session Duration', values: ['30 Minutes', '60 Minutes', '2 Hours'] },
               { name: 'Meeting Format', values: ['Google Meet / Zoom', 'In-Person (On-site)'] }
          ]
     }
};

/**
 * Automatically creates categories, sub-categories, sub-sub-categories, and
 * product attributes with their values based on the selected store type.
 * Uses the API clients to feed data sequentially for the new merchant.
 */
export const runAutoSetup = async (
     storeType: string,
     token: string,
     createdBy: number | string
): Promise<void> => {
     const data = staticDataByStoreType[storeType];
     if (!data) {
          console.warn(`No static data template configured for store type: ${storeType}`);
          return;
     }

     // 1. Create Product Attributes & Values
     if (data.attributes && Array.isArray(data.attributes)) {
          for (const attr of data.attributes) {
               try {
                    // Create Attribute
                    const dbAttr = await attributesService.createAttribute(attr.name);

                    // Add values for this Attribute
                    if (dbAttr && dbAttr.id) {
                         for (const val of attr.values) {
                              await attributesService.createAttributeValue(dbAttr.id, val);
                         }
                    }
               } catch (err) {
                    console.error(`AutoSetup: Failed to populate attribute "${attr.name}":`, err);
               }
          }
     }

     // 2. Create Categories hierarchy (Categories -> Sub -> Sub-Sub)
     if (data.categories && Array.isArray(data.categories)) {
          for (let cIdx = 0; cIdx < data.categories.length; cIdx++) {
               const cat = data.categories[cIdx];
               try {
                    // Create root Category
                    const rootCat = await categoriesService.createCategory({
                         name: cat.name,
                         description: cat.description,
                         status: 1,
                         is_menu: true,
                         created_by: createdBy,
                         parent_id: null,
                         priority: cIdx
                    });

                    // Create Sub Categories
                    if (rootCat && rootCat.id && cat.subCategories) {
                         for (let sIdx = 0; sIdx < cat.subCategories.length; sIdx++) {
                              const sub = cat.subCategories[sIdx];
                              const subCat = await categoriesService.createCategory({
                                   name: sub.name,
                                   description: sub.description,
                                   status: 1,
                                   is_menu: true,
                                   created_by: createdBy,
                                   parent_id: rootCat.id,
                                   priority: sIdx
                              });

                              // Create Sub-Sub Categories
                              if (subCat && subCat.id && sub.subSubCategories) {
                                   for (let ssIdx = 0; ssIdx < sub.subSubCategories.length; ssIdx++) {
                                        const ssName = sub.subSubCategories[ssIdx];
                                        await categoriesService.createCategory({
                                             name: ssName,
                                             description: `Selection of ${ssName}`,
                                             status: 1,
                                             is_menu: true,
                                             created_by: createdBy,
                                             parent_id: subCat.id,
                                             priority: ssIdx
                                        });
                                   }
                              }
                         }
                    }
               } catch (err) {
                    console.error(`AutoSetup: Failed to populate category "${cat.name}":`, err);
               }
          }
     }
};
