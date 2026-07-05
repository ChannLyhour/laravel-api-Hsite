import React from 'react';
import {
  FiArrowLeft, FiPrinter, FiDownload, FiUser, FiPhone, FiMail,
  FiMapPin, FiCreditCard, FiHome, FiCalendar, FiPlayCircle,
  FiCheck, FiXCircle, FiTag, FiTruck
} from 'react-icons/fi';
import { StatusOrder } from './components/StatusOrder';
import { OrderManage } from './components/OrderManage';
import { PopupDetailLocation } from './components/PopupDetialLoaction';
import { toast } from '@/pages/owner_manage/utils/toast';
import { useConfirm } from '@/components/ConfirmProvider';
import { storesService, Store_setting } from '@/api/owner/stores';
import { customersService } from '@/api/owner/customers';
import { couponsService } from '@/api/owner/coupons';
import { deliveryMethodsService } from '@/api/owner/deliveryMethods';
import type { CouponRow } from '@/api/owner/coupons';
import { resolveImageUrl } from '@/api/imageUtils';
import '@/pages/owner_manage/style/font.css';

export interface OrderItem {
  name: string;
  qty: number;
  price: string;
  image?: string;
}

export interface Order {
  id: string;
  order_no?: string;
  userId?: string;
  storeId?: number | string;
  customerId?: number;
  customer: string;
  email: string;
  customer_email?: string | null;
  phone: string;
  address: string;
  items: OrderItem[];
  total: string;
  status: 'pending' | 'confirm' | 'processing' | 'canceled' | 'cancelled' | 'complete' | 'delivering';
  time: string;
  store: string;
  storePhone?: string;
  storeAddress?: string;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod: string;
  couponCode?: string;
  discountAmount?: string;
  taxAmount?: string;
  orderType?: string;
  shippingFee?: string;
  notes?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  shippingAddress?: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    telephone: string;
    address: string;
    country: string | null;
    city_province: string;
    latitude: number | string | null;
    longitude: number | string | null;
  } | null;
}

interface ShowOrderPageProps {
  order: Order;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: Order['status']) => void;
  onPaymentStatusChange: (orderId: string, newStatus: Order['paymentStatus']) => void;
}

export const ShowOrderPage: React.FC<ShowOrderPageProps> = ({
  order,
  onClose,
  onStatusChange,
  onPaymentStatusChange,
}) => {
  const confirm = useConfirm();

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-50 text-blue-700 border border-blue-100 shadow-[0_1px_2px_rgba(59,130,246,0.05)]';
      case 'confirm':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-[0_1px_2px_rgba(99,102,241,0.05)]';
      case 'processing':
        return 'bg-amber-50 text-amber-700 border border-amber-100 shadow-[0_1px_2px_rgba(245,158,11,0.05)]';
      case 'delivering':
        return 'bg-cyan-50 text-cyan-700 border border-cyan-100 shadow-[0_1px_2px_rgba(6,182,212,0.05)]';
      case 'canceled':
        return 'bg-rose-50 text-rose-700 border border-rose-100 shadow-[0_1px_2px_rgba(244,63,94,0.05)]';
      case 'complete':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-[0_1px_2px_rgba(16,185,129,0.05)]';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const getStatusDotColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-500';
      case 'confirm': return 'bg-indigo-500';
      case 'processing': return 'bg-amber-500';
      case 'delivering': return 'bg-cyan-500';
      case 'canceled': return 'bg-rose-500';
      case 'complete': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: Order['status'] | 'all') => {
    switch (status) {
      case 'all': return 'All';
      case 'pending': return 'Pending';
      case 'confirm': return 'Confirmed';
      case 'processing': return 'Processing';
      case 'delivering': return 'Delivering';
      case 'canceled': return 'Canceled';
      case 'complete': return 'Complete';
      default: return status;
    }
  };

  const transitionStatus = async (newStatus: Order['status']) => {
    const confirmed = await confirm({
      title: 'Update Order Status',
      message: `Are you sure you want to change the order status to "${getStatusLabel(newStatus)}"?`,
      confirmText: 'Yes, Update',
      cancelText: 'Keep Current',
      type: newStatus === 'canceled' ? 'danger' : 'info'
    });

    if (confirmed) {
      onStatusChange(order.id, newStatus);
      toast.success(`Order #${order.order_no || order.id} status updated to ${getStatusLabel(newStatus)}!`);
    }
  };

  const togglePayment = async () => {
    const newStatus: Order['paymentStatus'] = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    const confirmed = await confirm({
      title: 'Update Payment Status',
      message: `Are you sure you want to mark this invoice payment as "${newStatus}"?`,
      confirmText: 'Yes, Mark',
      cancelText: 'Cancel',
      type: 'info'
    });

    if (confirmed) {
      onPaymentStatusChange(order.id, newStatus);
      toast.success(`Order #${order.order_no || order.id} payment updated to ${newStatus}!`);
    }
  };

  const [realStoreDetails, setRealStoreDetails] = React.useState<{
    name: string;
    phone: string;
    address: string;
    taxPercentage?: string | number;
    latitude?: string | number | null;
    longitude?: string | number | null;
    logoUrl?: string | null;
  } | null>(null);
  const [realCustomerDetails, setRealCustomerDetails] = React.useState<{
    customer: string;
    email: string;
    phone: string;
    image?: string | null;
    gender?: string | null;
    country?: string | null;
    address?: string | null;
    city?: string | null;
    orders_count?: number | null;
  } | null>(null);
  const [couponDetails, setCouponDetails] = React.useState<CouponRow | null>(null);
  const [showLocationMap, setShowLocationMap] = React.useState(false);

  React.useEffect(() => {
    if (order.storeId) {
      storesService.getStore(Number(order.storeId))
        .then((sData) => {
          if (sData) {
            setRealStoreDetails({
              name: sData.store_name || order.store || '---',
              phone: sData.store_phone || '---',
              address: sData.store_address || '---',
              taxPercentage: sData.tax_percentage,
              latitude: sData.store_latitude,
              longitude: sData.store_longitude,
              logoUrl: sData.logo_url
            });
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch real-time store settings for order invoice:', err);
        });
    }
  }, [order.storeId]);

  React.useEffect(() => {
    const targetUserId = order.userId || order.customerId;
    if (targetUserId) {
      customersService.getCustomers(0, 1000)
        .then((customers) => {
          if (Array.isArray(customers)) {
            const match = customers.find(c => 
              String(c.user_id) === String(targetUserId) || 
              String(c.id) === String(targetUserId)
            );
            if (match) {
              setRealCustomerDetails({
                customer: match.name || order.customer,
                email: match.email || order.email,
                phone: match.phone || order.phone,
                image: match.image,
                gender: match.gender,
                country: match.country,
                address: match.address,
                city: match.city,
                orders_count: match.orders_count
              });
            } else {
              // Fallback to direct fetch
              customersService.getCustomer(Number(targetUserId))
                .then((cData) => {
                  if (cData) {
                    setRealCustomerDetails({
                      customer: cData.name || order.customer,
                      email: cData.email || order.email,
                      phone: cData.phone || order.phone,
                      image: cData.image,
                      gender: cData.gender,
                      country: cData.country,
                      address: cData.address,
                      city: cData.city,
                      orders_count: cData.orders_count
                    });
                  }
                })
                .catch(() => {});
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch customers list for matching:', err);
        });
    }
  }, [order.userId, order.customerId]);

  React.useEffect(() => {
    if (order.couponCode) {
      couponsService.validateCode(order.couponCode)
        .then((cData) => {
          if (cData) {
            setCouponDetails(cData);
          }
        })
        .catch(() => {
          couponsService.getCoupons()
            .then((list) => {
              if (Array.isArray(list)) {
                const match = list.find(c => c.code.toLowerCase() === order.couponCode?.toLowerCase());
                if (match) {
                  setCouponDetails(match);
                }
              }
            })
            .catch(() => {});
        });
    }
  }, [order.couponCode]);

  const [deliveryMethods, setDeliveryMethods] = React.useState<any[]>([]);

  React.useEffect(() => {
    deliveryMethodsService.getMyDeliveryMethods()
      .then((data) => {
        if (data) {
          setDeliveryMethods(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch delivery methods for order invoice image matching:', err);
      });
  }, []);

  const [paymentGateways, setPaymentGateways] = React.useState<any[]>([]);

  React.useEffect(() => {
    storesService.getPaymentGateways()
      .then((data) => {
        if (data && Array.isArray(data)) {
          setPaymentGateways(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch payment gateways for order invoice image matching:', err);
      });
  }, []);

  const getPaymentMethodDetails = () => {
    const defaultTemplates = [
      { id: 'aba', name: 'ABA PAY', logoColor: 'bg-[#005d7e]', textColor: 'text-white', logoText: 'ABA' },
      { id: 'bakong', name: 'Bakong KHQR', logoColor: 'bg-[#b30006]', textColor: 'text-white', logoText: 'Bakong' },
      { id: 'card', name: 'Credit/Debit Card', logoColor: 'bg-slate-100 border border-slate-200', textColor: 'text-slate-800', logoText: '💳' },
      { id: 'acleda', name: 'ACLEDA PAY', logoColor: 'bg-[#0d3b66]', textColor: 'text-amber-400', logoText: 'ACLEDA' },
      { id: 'wing', name: 'Wing Bank', logoColor: 'bg-[#84bd00]', textColor: 'text-blue-900', logoText: 'Wing' },
      { id: 'chipmong', name: 'CHIP MONG BANK', logoColor: 'bg-[#009b72]', textColor: 'text-white', logoText: 'CMB' },
      { id: 'transfer', name: 'Bank Transfer', logoColor: 'bg-slate-50 border border-slate-200', textColor: 'text-slate-700', logoText: '🏦' },
      { id: 'cod', name: 'Cash on Delivery', logoColor: 'bg-slate-50 border border-slate-200', textColor: 'text-slate-700', logoText: '💵' },
      { id: 'cash', name: 'Cash', logoColor: 'bg-emerald-600', textColor: 'text-white', logoText: '💵' }
    ];

    const methodKey = (order.paymentMethod || '').toLowerCase().trim();
    
    // Find in fetched gateways first
    const gateway = paymentGateways.find(
      g => g.id.toLowerCase() === methodKey ||
           g.name.toLowerCase().trim() === methodKey ||
           methodKey.includes(g.id.toLowerCase()) ||
           methodKey.includes(g.name.toLowerCase().trim())
    );
    
    // Find in default templates
    const template = defaultTemplates.find(
      t => t.id.toLowerCase() === methodKey ||
           t.name.toLowerCase().trim() === methodKey ||
           methodKey.includes(t.id.toLowerCase()) ||
           methodKey.includes(t.name.toLowerCase().trim())
    );
    
    const finalGateway = gateway || template;
    const displayName = finalGateway ? finalGateway.name : (order.paymentMethod === 'cod' ? 'Cash On Delivery' : order.paymentMethod);
    
    // Check if custom logo is configured in settings
    const gatewayId = finalGateway?.id;
    const customLogoUrl = gatewayId ? settings?.payment_methods?.[gatewayId]?.values?.logo_url : null;
    
    return {
      name: displayName,
      logoUrl: customLogoUrl ? resolveImageUrl(customLogoUrl) : null,
      logoColor: finalGateway?.logoColor || 'bg-slate-50 border border-slate-200',
      textColor: finalGateway?.textColor || 'text-slate-700',
      logoText: finalGateway?.logoText || '💳'
    };
  };

  // Subtotal & taxes helper calculations
  const subtotal = order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);

  // Dynamic delivery fee from settings fallback
  let deliveryFee = 0;
  let threshold = 0;
  let taxRate = 0; // Default to 0% if not configured in store settings

  const settings = Store_setting();
  if (settings) {
    if (settings.shipping_fee) deliveryFee = parseFloat(settings.shipping_fee);
    if (settings.free_shipping_threshold) threshold = parseFloat(settings.free_shipping_threshold);
    if (settings.tax_percentage !== undefined && settings.tax_percentage !== null) {
      taxRate = parseFloat(settings.tax_percentage);
    }
  }

  // Override with real store details if fetched
  if (realStoreDetails?.taxPercentage !== undefined && realStoreDetails.taxPercentage !== null) {
    taxRate = parseFloat(String(realStoreDetails.taxPercentage));
  }

  // Apply threshold
  if (threshold > 0 && subtotal > threshold) deliveryFee = 0;

  // Real delivery fee overrides the fallback settings
  if (order.shippingFee !== undefined && order.shippingFee !== null) {
    deliveryFee = parseFloat(order.shippingFee);
  }

  // Real tax data calculation: Priority 1: tax_amount from order object, Priority 2: dynamic calculation
  const tax = order.taxAmount !== undefined
    ? parseFloat(order.taxAmount)
    : subtotal * (taxRate / 100);

  // Infer tax rate percentage label dynamically if real taxAmount is present
  const displayTaxRate = order.taxAmount !== undefined && subtotal > 0
    ? Math.round((parseFloat(order.taxAmount) / subtotal) * 100)
    : taxRate;

  const grandTotal = parseFloat(order.total);

  // Fallbacks: priority order: (1) realStoreDetails dynamically fetched, (2) order model properties, (3) local store settings fallback
  const storeName = realStoreDetails?.name || (order.store && order.store !== '---' && !order.store.startsWith('Store #') ? order.store : (settings?.store_name || order.store || '---'));
  const storePhone = realStoreDetails?.phone || (order.storePhone && order.storePhone !== '---' ? order.storePhone : (settings?.store_phone || '---'));
  const storeAddress = realStoreDetails?.address || (order.storeAddress && order.storeAddress !== '---' ? order.storeAddress : (settings?.store_address || '---'));
  const storeLatitude = realStoreDetails?.latitude || settings?.store_latitude || null;
  const storeLongitude = realStoreDetails?.longitude || settings?.store_longitude || null;
  const storeLogo = resolveImageUrl(realStoreDetails?.logoUrl || settings?.logo_url || '');

  // Customer Fallbacks: (1) realCustomerDetails dynamically fetched from API, (2) order properties
  const isWalkIn = order.address === 'POS Walk-in' || order.customer === 'Walk In Customer' || order.orderType === 'walk_in';
  const customerName = isWalkIn ? 'Walk-in' : (realCustomerDetails?.customer || order.customer);
  const customerEmail = isWalkIn ? '---' : (realCustomerDetails?.email || order.email);
  const customerPhone = isWalkIn ? '---' : (realCustomerDetails?.phone || order.phone);



  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in print:p-0">

      {/* ── Invoice Navigation Bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border rounded-[5px] p-4.5 shadow-sm print:hidden transition-all duration-300 custom-card-container">
        <button
          onClick={onClose}
          className="group flex items-center space-x-2 px-4 py-2.5 border rounded-[5px] text-xs font-bold text-inherit bg-black/[0.03] hover:bg-black/[0.06] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
        >
          <FiArrowLeft className="w-4 h-4 text-slate-500 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Order List</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2.5 border rounded-[5px] text-xs font-bold text-inherit bg-black/[0.03] hover:bg-black/[0.06] active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
          >
            <FiPrinter className="w-4 h-4 text-slate-500" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={() => toast.success('Downloading Invoice PDF...')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/95 hover:to-orange-600 text-white rounded-[5px] text-xs font-black transition-all cursor-pointer shadow-sm shadow-orange-500/10 hover:shadow-md active:scale-[0.98] duration-200 border-none"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout Splits ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Premium Printable Invoice Section */}
        <div className="lg:col-span-2 relative border rounded-[5px] shadow-sm overflow-hidden p-6 sm:p-8 space-y-6 print:border-0 print:shadow-none print:p-0 custom-card-container">

          {/* Subtle brand colored top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-orange-400 print:hidden" />

          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-inherit">Invoice Details</span>
                <span className="text-xs text-primary font-black uppercase bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-[5px]">
                  #{order.order_no || order.id}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Placed on {order.time}</span>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-[10px] uppercase tracking-wider font-black shadow-3xs ${getStatusBadge(order.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(order.status)} animate-pulse`} />
                <span>{getStatusLabel(order.status)}</span>
              </span>
              <div className="text-xs font-semibold opacity-60">
                Store: <span className="font-black bg-black/[0.04] border px-2 py-0.5 rounded-[5px] ml-1 text-inherit border-black/5">{storeName}</span>
              </div>
            </div>
          </div>

          {/* Lifecycle progress stepper */}
          <StatusOrder status={order.status} isWalkIn={isWalkIn} />

          {/* Canceled warning alert */}
          {order.status === 'canceled' && (
            <div className="bg-rose-50/50 border border-rose-100 rounded-[5px] p-4 text-xs font-bold text-rose-800 flex items-center gap-3 print:hidden">
              <FiXCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-rose-900">This Order has been Canceled</p>
                <p className="text-rose-600 font-medium mt-0.5">No further workflow actions can be performed on this transaction.</p>
              </div>
            </div>
          )}

          {/* Invoice Address Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
            <div className="group border-l-4 border-l-primary bg-black/[0.015] hover:bg-black/[0.035] p-4.5 rounded-r-[5px] border-y border-r transition-all duration-300 hover:-translate-y-0.5 font-bold font-kuntomruy">
              <h4 className="font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 mb-3 text-slate-500">
                <FiHome className="text-primary w-3.5 h-3.5" />
                <span>Store Information</span>
              </h4>
              <div className="text-xs space-y-1.5">
                <p className="font-black text-sm text-slate-800">{storeName}</p>
                <p className="font-medium leading-relaxed flex items-start gap-1 text-slate-850">
                  <span className="text-slate-500 font-semibold">Location :</span> 
                  <span>{storeAddress}</span>
                </p>
                <p className="font-medium flex items-center gap-1 text-slate-850">
                  <span className="text-slate-500 font-semibold">Telephone :</span> 
                  <span>{storePhone}</span>
                </p>
              </div>
            </div>

            <div className="group border-l-4 border-l-indigo-500 bg-black/[0.015] hover:bg-black/[0.035] p-4.5 rounded-r-[5px] border-y border-r transition-all duration-300 hover:-translate-y-0.5 font-bold font-kuntomruy">
              <h4 className="font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 mb-3 text-slate-500">
                <FiMapPin className="text-indigo-500 w-3.5 h-3.5" />
                <span>{order.address === 'POS Walk-in' ? 'Walk-in Customer' : 'Shipping Address'}</span>
              </h4>
              <div className="text-xs space-y-1.5">
                <p className="font-black text-sm text-slate-800">{customerName}</p>
                <p className="font-medium leading-relaxed flex items-start gap-1 flex-wrap text-slate-855">
                  <span className="text-slate-500 font-semibold">Location :</span> 
                  <span>{order.address === 'Walk-in' ? '---' : order.address}</span>
                  {order.address && order.address !== 'Walk-in' && order.address !== 'POS Walk-in' && (
                    <button
                      onClick={() => setShowLocationMap(true)}
                      className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-650 text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all active:scale-95 shrink-0"
                      type="button"
                    >
                      <FiMapPin className="w-3 h-3 text-indigo-550" />
                      <span>View Map</span>
                    </button>
                  )}
                </p>
                <p className="font-medium flex items-center gap-1 text-slate-855">
                  <span className="text-slate-500 font-semibold">Telephone :</span> 
                  <span>{customerPhone}</span>
                </p>
              </div>
            </div>

            <div className="group border-l-4 border-l-emerald-500 bg-black/[0.015] hover:bg-black/[0.035] p-4.5 rounded-r-[5px] border-y border-r transition-all duration-300 hover:-translate-y-0.5 font-bold font-kuntomruy">
              <h4 className="font-extrabold uppercase text-[10px] tracking-wider flex items-center gap-2 mb-3 text-slate-500">
                <FiTruck className="text-emerald-500 w-3.5 h-3.5" />
                <span>Delivery & Notes</span>
              </h4>
              <div className="text-xs space-y-1.5">
                {(() => {
                  const notesStr = order.notes || '';
                  const deliveryMethod = notesStr.match(/^\[Delivery:\s*([^\]]+)\]/) 
                    ? notesStr.match(/^\[Delivery:\s*([^\]]+)\]/)![1] 
                    : (order.address === 'POS Walk-in' ? 'Walk-in Store Purchase' : 'Standard Shipping');
                  const cleanNotes = notesStr.replace(/^\[Delivery:\s*[^\]]+\]\s*/, '');
                  
                  // Match method and get logo URL
                  const matchedMethod = deliveryMethods.find(
                    m => m.name.toLowerCase().trim() === deliveryMethod.toLowerCase().trim() ||
                         deliveryMethod.toLowerCase().trim().includes(m.name.toLowerCase().trim()) ||
                         m.name.toLowerCase().trim().includes(deliveryMethod.toLowerCase().trim())
                  );
                  const matchedImage = matchedMethod?.image ? resolveImageUrl(matchedMethod.image) : null;

                  return (
                    <>
                      <div className="font-medium leading-relaxed flex items-center gap-2 text-slate-855">
                        <span className="text-slate-500 font-semibold shrink-0">Method :</span>
                        <div className="flex items-center gap-1.5 bg-black/[0.02] border border-black/5 rounded-[5px] px-2 py-0.5 select-none">
                          <div className="w-5 h-5 rounded-[3px] overflow-hidden bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center font-black shadow-3xs shrink-0">
                            {matchedImage ? (
                              <img
                                src={matchedImage}
                                alt={deliveryMethod}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : null}
                            <span className="w-full h-full flex items-center justify-center" style={{ display: matchedImage ? 'none' : 'flex' }}>
                              <FiTruck className="w-2.5 h-2.5" />
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-800 text-[11px]">{deliveryMethod}</span>
                        </div>
                      </div>
                      <p className="font-medium flex items-start gap-1 text-slate-855 mt-1">
                        <span className="text-slate-500 font-semibold">Notes :</span>
                        <span className="leading-relaxed text-slate-700">{cleanNotes || '---'}</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Invoice Table Selections */}
          <div className="space-y-3">
            <h4 className="text-slate-500 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <span>Items & Menu Selection</span>
              <span className="ml-auto text-[10px] font-bold bg-black/[0.04] border px-2 py-0.5 rounded-[3px] text-inherit">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </span>
            </h4>
            <div className="border rounded-[5px] overflow-hidden shadow-2xs custom-card-container">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[10px] uppercase font-black tracking-wider custom-card-header-bar">
                    <th className="py-3.5 px-4 sm:px-5">Product</th>
                    <th className="py-3.5 px-4 text-center">Price</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-semibold">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.02] transition-colors duration-150">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[5px] overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0 flex items-center justify-center">
                            {it.image ? (
                              <img
                                src={resolveImageUrl(it.image)}
                                alt={it.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-black"
                              style={{ display: it.image ? 'none' : 'flex' }}
                            >
                              {it.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="font-extrabold text-inherit leading-tight">{it.name}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center opacity-70 font-bold">
                        ${parseFloat(it.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 min-w-[28px] h-7 rounded-[5px] bg-black/[0.04] border text-inherit text-xs font-black">
                          x{it.qty}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-inherit font-black">
                        ${(parseFloat(it.price) * it.qty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Receipt Pricing Totals */}
          <div className="pt-4 border-t border-dashed border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row justify-end">
              <div className="w-full sm:w-80 px-6 py-5 border rounded-sm space-y-4 bg-black/[0.015]">
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Subtotal</span>
                    <span>US ${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {((order.couponCode || (order.discountAmount && parseFloat(order.discountAmount) > 0))) && (
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center text-xs font-bold text-[#E61E25]">
                        <span className="flex items-center gap-1">
                          <FiTag className="w-3.5 h-3.5" />
                          {order.couponCode ? `Coupon (${order.couponCode})` : 'Discount'}
                        </span>
                        <span>- US ${parseFloat(order.discountAmount || '0').toFixed(2)}</span>
                      </div>
                      {couponDetails && (
                        <p className="text-[10px] opacity-60 font-medium leading-relaxed pl-4.5">
                          Active Coupon: <span className="font-semibold">{couponDetails.title}</span> 
                          {couponDetails.discount_type === 'percentage' 
                            ? ` (${couponDetails.discount_amount}% off)` 
                            : ` ($${couponDetails.discount_amount} off)`
                          }
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-semibold opacity-70">
                    <span>VAT/Tax ({displayTaxRate}%)</span>
                    <span>US ${tax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold opacity-70">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `US $${deliveryFee.toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-black text-inherit border-t pt-3">
                  <span>Amount paid</span>
                  <span className="text-base font-black">US ${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Workflow Actions & Customer Sidebar */}
        <div className="space-y-6">

          {/* Action 1: Delivery Order Workflow Manager */}
          <div className="border rounded-[5px] overflow-hidden shadow-sm custom-card-container">
            <div className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-orange-500/5">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-[5px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <FiPlayCircle className="text-primary w-3.5 h-3.5" />
                </div>
                <span>Order Manager</span>
              </h3>
              <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider mt-1 pl-9">
                Update order lifecycle status
              </p>
            </div>
            <div className="p-6">
              <OrderManage
                status={order.status}
                transitionStatus={transitionStatus}
                getStatusLabel={getStatusLabel}
              />
            </div>
          </div>

          {/* Action 2: Payment Details Card */}
          <div className="border rounded-[5px] overflow-hidden shadow-sm custom-card-container">
            <div className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-indigo-500/5 to-violet-500/5">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-[5px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <FiCreditCard className="text-indigo-500 w-3.5 h-3.5" />
                </div>
                <span>Payment</span>
              </h3>
              <p className="opacity-50 text-[10px] font-bold uppercase tracking-wider mt-1 pl-9">
                Inspect and modify billing state
              </p>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Payment Status Visual */}
              <div className={`flex items-center gap-3 p-3.5 rounded-[5px] border ${
                order.paymentStatus === 'Paid'
                  ? 'bg-emerald-50/50 border-emerald-100'
                  : 'bg-rose-50/50 border-rose-100'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}>
                  {order.paymentStatus === 'Paid'
                    ? <FiCheck className="w-4.5 h-4.5 stroke-[2.5]" />
                    : <FiXCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                  }
                </div>
                <div>
                  <p className={`text-xs font-black ${
                    order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {order.paymentStatus === 'Paid' ? 'Payment Received' : 'Payment Pending'}
                  </p>
                  <p className="text-[10px] font-medium opacity-60 mt-0.5">
                    {order.paymentStatus === 'Paid'
                      ? 'This invoice has been fully paid'
                      : 'Awaiting payment from customer'
                    }
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex justify-between items-center font-semibold p-3 rounded-[5px] bg-black/[0.015] border">
                <span className="text-inherit flex items-center gap-2 font-bold">
                  <FiCreditCard className="w-3.5 h-3.5 opacity-50" />
                  <span>Method</span>
                </span>
                {(() => {
                  const pmDetails = getPaymentMethodDetails();
                  return (
                    <div className="flex items-center gap-1.5 bg-white border px-2.5 py-1 rounded-[5px] shadow-2xs select-none">
                      {pmDetails.logoUrl ? (
                        <div className="w-7.5 h-5 rounded-[3px] overflow-hidden border border-black/5 bg-black/[0.02] flex items-center justify-center shrink-0 shadow-3xs">
                          <img
                            src={pmDetails.logoUrl}
                            alt={pmDetails.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className={`w-7.5 h-5 rounded-[3px] shrink-0 flex items-center justify-center font-black text-center shadow-3xs leading-none select-none px-0.5 ${pmDetails.logoColor} ${pmDetails.textColor} ${pmDetails.logoText.length > 5 ? 'text-[5px]' : 'text-[7px]'}`}>
                          {pmDetails.logoText}
                        </div>
                      )}
                      <span className="font-extrabold text-slate-800 text-[11px]">
                        {pmDetails.name}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center font-semibold p-3 rounded-[5px] bg-black/[0.015] border">
                <span className="text-inherit font-bold">Amount</span>
                <span className="font-black text-sm">US ${grandTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={togglePayment}
                className={`w-full py-2.5 rounded-[5px] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98] border ${
                  order.paymentStatus === 'Paid'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
              >
                {order.paymentStatus === 'Paid' ? <FiXCircle className="w-3.5 h-3.5" /> : <FiCheck className="w-3.5 h-3.5" />}
                Mark as {order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}
              </button>
            </div>
          </div>

          {/* Action 3: Customer Briefing Card */}
          <div className="border rounded-[5px] p-6 shadow-sm space-y-4 custom-card-container">
            <div className="pb-3 border-b">
              <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <FiUser className="text-blue-500 w-4.5 h-4.5 shrink-0" />
                <span>Customer Information</span>
              </h3>
              <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                profile information
              </p>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-[5px] bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0 shadow-2xs font-kuntomruy overflow-hidden">
                  {realCustomerDetails?.image ? (
                    <img 
                      src={resolveImageUrl(realCustomerDetails.image)} 
                      alt={customerName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    customerName ? customerName.charAt(0).toUpperCase() : <FiUser className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-black text-inherit text-sm">{customerName}</p>
                  <p className="text-slate-400 text-[10px] font-bold">
                    {isWalkIn ? 'Walk-in Customer' : 'Verified Customer Account'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t">
                {customerEmail === '---' ? (
                  <div className="flex items-center gap-2.5 p-2 text-inherit font-bold leading-relaxed opacity-60">
                    <FiMail className="w-4 h-4 shrink-0" />
                    <span>---</span>
                  </div>
                ) : (
                  <a
                    href={`mailto:${customerEmail}`}
                    className="flex items-center gap-2.5 p-2 rounded-[5px] hover:bg-black/[0.04] text-inherit border border-transparent hover:border-black/5 transition-all duration-200 cursor-pointer font-bold"
                  >
                    <FiMail className="w-4 h-4 shrink-0" />
                    <span className="font-medium truncate">{customerEmail}</span>
                  </a>
                )}

                {customerPhone === '---' ? (
                  <div className="flex items-center gap-2.5 p-2 text-inherit font-bold leading-relaxed opacity-60">
                    <FiPhone className="w-4 h-4 shrink-0" />
                    <span>---</span>
                  </div>
                ) : (
                  <a
                    href={`tel:${customerPhone}`}
                    className="flex items-center gap-2.5 p-2 rounded-[5px] hover:bg-black/[0.04] text-inherit border border-transparent hover:border-black/5 transition-all duration-200 cursor-pointer font-bold"
                  >
                    <FiPhone className="w-4 h-4 shrink-0" />
                    <span className="font-medium">{customerPhone}</span>
                  </a>
                )}
              </div>

              {/* Additional Customer Metadata */}
              {(realCustomerDetails || order.address === 'POS Walk-in') && (
                <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-medium leading-relaxed">
                  {realCustomerDetails?.gender && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Gender:</span>
                      <span className="text-slate-700 capitalize font-bold">{realCustomerDetails.gender}</span>
                    </div>
                  )}
                  {realCustomerDetails?.orders_count !== undefined && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Total Orders:</span>
                      <span className="text-slate-700 font-bold">{realCustomerDetails.orders_count} Placed</span>
                    </div>
                  )}
                  {realCustomerDetails?.city && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">City/Region:</span>
                      <span className="text-slate-700 font-bold">{realCustomerDetails.city}</span>
                    </div>
                  )}
                  {realCustomerDetails?.address && realCustomerDetails.address !== order.address && (
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="text-slate-400">Profile Address:</span>
                      <span className="text-slate-700 font-bold leading-normal">{realCustomerDetails.address}</span>
                    </div>
                  )}
                  {order.address === 'POS Walk-in' && (
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Order Channel:</span>
                      <span className="text-slate-700 font-bold">POS Counter Checkout</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {showLocationMap && (
        <PopupDetailLocation
          onClose={() => setShowLocationMap(false)}
          customerName={customerName}
          customerPhone={customerPhone}
          addressText={order.address === 'Walk-in' ? '' : order.address}
          latitude={order.latitude ?? order.shippingAddress?.latitude}
          longitude={order.longitude ?? order.shippingAddress?.longitude}
          storeLatitude={storeLatitude}
          storeLongitude={storeLongitude}
          storeName={storeName}
          storeLogo={storeLogo}
          deliveryMethod={(() => {
            const notesStr = order.notes || '';
            return notesStr.match(/^\[Delivery:\s*([^\]]+)\]/) 
              ? notesStr.match(/^\[Delivery:\s*([^\]]+)\]/)![1] 
              : (order.address === 'POS Walk-in' ? 'Walk-in Store Purchase' : 'Standard Shipping');
          })()}
          deliveryFee={deliveryFee}
        />
      )}
    </div>
  );
};
