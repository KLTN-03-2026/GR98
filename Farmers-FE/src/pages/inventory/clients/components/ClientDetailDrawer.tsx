import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Client } from '../api/hooks';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ClientDetailDrawerProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientDetailDrawer({ client, isOpen, onClose }: ClientDetailDrawerProps) {
  if (!client) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4 pr-6 text-left">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              <AvatarImage src={client.user.avatar || ''} />
              <AvatarFallback className="text-xl">{client.user.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold truncate">
                {client.user.fullName}
              </SheetTitle>
              <SheetDescription className="hidden">
                Chi tiết thông tin khách hàng và địa chỉ nhận hàng
              </SheetDescription>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                  {client.user.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3" />
                  Gia nhập {format(new Date(client.user.createdAt), 'MM/yyyy')}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Thông tin liên hệ */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Thông tin liên hệ
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
              <div className="flex items-center gap-3 text-sm">
                <div className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                  <Phone className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Số điện thoại</span>
                  <span className="font-medium">{client.user.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="size-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                  <Package className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">Tổng đơn hàng</span>
                  <span className="font-medium">{client._count.orders} đơn</span>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Danh sách địa chỉ */}
          <section className="space-y-3 pb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1 flex justify-between items-center">
              Địa chỉ nhận hàng
              <Badge variant="outline" className="font-normal">{client.shippingAddresses.length}</Badge>
            </h3>
            
            <div className="space-y-3">
              {client.shippingAddresses.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <MapPin className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Chưa có địa chỉ giao hàng</p>
                </div>
              ) : (
                client.shippingAddresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      addr.isDefault 
                        ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{addr.fullName}</span>
                        {addr.isDefault && (
                          <Badge variant="default" className="h-4 text-[10px] px-1.5 uppercase font-bold tracking-tight">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                        <Phone className="size-3" />
                        {addr.phone}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="size-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {addr.addressLine}{addr.district ? `, ${addr.district}` : ''}, {addr.province}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
