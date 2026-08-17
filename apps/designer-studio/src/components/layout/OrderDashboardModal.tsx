import React, { useState } from 'react';
import { Package, X, Download, Filter, Search } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export interface OrderItem {
  orderId: string;
  submissionId: string;
  publicToken: string;
  customerNames: string;
  weddingDate: string;
  venue: string;
  status: 'draft' | 'awaiting_customer' | 'submitted' | 'changes_requested' | 'approved' | 'production' | 'completed' | 'cancelled';
  productionStatus: 'not_started' | 'preflight' | 'ready' | 'in_production' | 'completed';
  createdAt: string;
  approvedAt: string | null;
}

export const OrderDashboardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { showToast } = useStudioStore();
  const [filter, setFilter] = useState<string>('All');

  const INITIAL_ORDERS: OrderItem[] = [
    {
      orderId: 'RM-1001',
      submissionId: 'sub-001',
      publicToken: 'pub_tok_royal_floral_123',
      customerNames: 'Ananya & Arjun',
      weddingDate: '24 October 2026',
      venue: 'Sri Convention Hall',
      status: 'approved',
      productionStatus: 'ready',
      createdAt: '2026-08-17T14:30:00Z',
      approvedAt: '2026-08-17T15:00:00Z'
    },
    {
      orderId: 'RM-1002',
      submissionId: 'sub-002',
      publicToken: 'pub_tok_gold_arch_456',
      customerNames: 'Priya & Rahul',
      weddingDate: '15 November 2026',
      venue: 'Grand Palace, Bengaluru',
      status: 'submitted',
      productionStatus: 'not_started',
      createdAt: '2026-08-17T18:20:00Z',
      approvedAt: null
    }
  ];

  const [orders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' || o.status.toLowerCase().includes(filter.toLowerCase()) || o.productionStatus.toLowerCase().includes(filter.toLowerCase());
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      o.orderId.toLowerCase().includes(query) ||
      o.customerNames.toLowerCase().includes(query) ||
      o.venue.toLowerCase().includes(query) ||
      o.weddingDate.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const handleGenerateProductionPackage = (order: OrderItem) => {
    showToast(`📦 Generating Production Package for Order ${order.orderId}…`);
    setTimeout(() => {
      // Trigger manifest & SVG downloads
      const manifest = {
        orderId: order.orderId,
        customerNames: order.customerNames,
        weddingDate: order.weddingDate,
        venue: order.venue,
        approvedAt: order.approvedAt,
        status: 'IMMUTABLE_PRODUCTION_SNAPSHOT',
        paperGsm: 300,
        layers: ['Cut_Plate', 'PartialCut_Plate', 'Score_Plate', 'Perforation_Plate', 'Engrave_Plate']
      };
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order.orderId}_Production_Manifest.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Downloaded Immutable Production Package (${order.orderId}_Production_Manifest.json)!`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div
        className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] text-xs select-none"
        style={{ background: '#161412', borderColor: '#252118', color: '#E5D7C5' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#252118' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C9956C]/10 text-[#C9956C] border border-[#C9956C]/30">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#E5D7C5]">
                Order & Production Dashboard
              </h3>
              <p className="text-xs text-[#8C8073]">
                Manage customer submission proofs, approved orders, and manufacturing production snapshots
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8C8073] hover:text-[#E5D7C5] hover:bg-[#252118]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar & Filter Pills */}
        <div className="px-5 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3" style={{ borderColor: '#252118' }}>
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 text-[#8C8073] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (RM-1001), Bride, Groom, Customer name, or Venue..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#141210] text-[#E5D7C5] border border-[#252118] focus:border-[#C9956C] outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <Filter className="h-3.5 w-3.5 text-[#8C8073] flex-shrink-0" />
            {['All', 'Awaiting Customer', 'Submitted', 'Changes Requested', 'Approved', 'Production', 'Completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                  filter === f
                    ? 'bg-[#C9956C] text-[#161412] border-[#C9956C]'
                    : 'bg-[#1A1816] text-[#8C8073] border-[#252118] hover:text-[#E5D7C5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table & Cards */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1A1816] border border-[#252118] text-[#8C8073]">
              No orders found matching filter "{filter}".
            </div>
          ) : (
            filteredOrders.map(o => (
              <div key={o.orderId} className="p-4 rounded-2xl bg-[#1A1816] border border-[#252118] space-y-3 hover:border-[#C9956C]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#C9956C] px-2.5 py-0.5 rounded-md bg-[#C9956C]/10 border border-[#C9956C]/30">
                      {o.orderId}
                    </span>
                    <span className="font-bold text-sm text-[#E5D7C5]">{o.customerNames}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.status === 'approved' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' :
                      o.status === 'submitted' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' :
                      'bg-[#252118] text-[#8C8073]'
                    }`}>
                      Order: {o.status}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      o.productionStatus === 'ready' ? 'bg-blue-950/60 text-blue-400 border border-blue-500/40' :
                      'bg-[#252118] text-[#8C8073]'
                    }`}>
                      Prod: {o.productionStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-[#8C8073] bg-[#141210] p-2.5 rounded-xl border border-[#252118]">
                  <div>Date: <strong className="text-[#E5D7C5]">{o.weddingDate}</strong></div>
                  <div>Venue: <strong className="text-[#E5D7C5]">{o.venue}</strong></div>
                  <div>Submitted: <strong className="text-[#E5D7C5]">{new Date(o.createdAt).toLocaleDateString()}</strong></div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8C8073]">
                    {o.approvedAt ? `✓ Approved on ${new Date(o.approvedAt).toLocaleDateString()} (Immutable Production Snapshot Created)` : 'Pending designer approval'}
                  </span>

                  {o.status === 'approved' ? (
                    <button
                      onClick={() => handleGenerateProductionPackage(o)}
                      className="px-4 py-2 rounded-xl font-bold bg-[#C9956C] text-[#161412] hover:bg-[#D4A37A] transition-all flex items-center gap-1.5 shadow-md text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Generate Production Package</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl font-bold bg-[#252118] text-[#8C8073] cursor-not-allowed text-xs border border-[#252118]"
                    >
                      Awaiting Approval
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDashboardModal;
