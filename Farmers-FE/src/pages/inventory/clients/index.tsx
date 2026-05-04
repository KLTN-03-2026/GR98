import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { useGetInventoryClients, type Client } from './api/hooks';
import { clientColumns } from './components/client-columns';
import { ClientDetailDrawer } from './components/ClientDetailDrawer';

export default function InventoryClientsPage() {
  const { data: clients = [], isLoading, isFetching, refetch } = useGetInventoryClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/12 bg-primary/8 text-primary">
              <Users className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Quản lý Khách hàng
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Danh sách khách hàng đã đăng ký tài khoản và thực hiện giao dịch trên nền tảng E-commerce.
          </p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
          <DataTable
            columns={clientColumns}
            data={clients}
            isLoading={isLoading || isFetching}
            onReload={() => refetch()}
            searchPlaceholder="Tìm kiếm khách hàng..."
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <ClientDetailDrawer 
        client={selectedClient}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
