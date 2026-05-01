import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetLots, useGetPendingHarvests, useCreateLot, useGetWarehouses } from './api/hooks';
import { LotsTable } from './components/LotsTable';
import { PendingHarvestsTable } from './components/PendingHarvestsTable';
import { CreateLotModal } from './components/CreateLotModal';
import type { PendingHarvest, CreateLotInput } from './api/types';
import { toast } from 'sonner';

export default function InventoryLotsPage() {
  const [activeTab, setActiveTab] = useState('existing');
  const [selectedHarvest, setSelectedHarvest] = useState<PendingHarvest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: lots = [], isLoading: isLoadingLots } = useGetLots({});
  const { data: pendingHarvests = [], isLoading: isLoadingPending } = useGetPendingHarvests();
  const { data: warehouses = [] } = useGetWarehouses();
  const createLotMutation = useCreateLot();

  const handleReceive = (harvest: PendingHarvest) => {
    setSelectedHarvest(harvest);
    setIsModalOpen(true);
  };

  const handleCreateLot = (data: CreateLotInput) => {
    createLotMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Đã nhập lô hàng và đối soát thành công');
        setIsModalOpen(false);
        setActiveTab('existing');
      },
      onError: (error: any) => {
        toast.error('Có lỗi xảy ra: ' + error.message);
      },
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý Lô hàng</h1>
        <p className="text-muted-foreground">
          Bàn giao & Đối soát sản lượng giữa Giám sát viên và Nhân viên kho (Stage 2).
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="existing">Lô hàng hiện có</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Chờ đối soát
            {pendingHarvests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {pendingHarvests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <LotsTable lots={lots} isLoading={isLoadingLots} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingHarvestsTable 
            harvests={pendingHarvests} 
            isLoading={isLoadingPending} 
            onReceive={handleReceive}
          />
        </TabsContent>
      </Tabs>

      <CreateLotModal
        harvest={selectedHarvest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLot}
        warehouses={warehouses}
      />
    </div>
  );
}
