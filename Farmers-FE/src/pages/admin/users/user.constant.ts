import type { FilterOption } from "@/components/custom/filter.popover";

export const USER_FILTER_OPTIONS: FilterOption[] = [
    {
        key: 'status',
        label: 'Status',
        values: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ],
    },
    {
        key: 'availability',
        label: 'Availability',
        values: [
            { value: 'ONLINE', label: 'ONLINE' },
            { value: 'OFFLINE', label: 'OFFLINE' },
            { value: 'SCHEDULED', label: 'SCHEDULED' },
        ],
    },
    {
        key: 'role',
        label: 'Role',
        values: [
            { value: 'Branch Manager', label: 'Branch Manager' },
            { value: 'Nail Technician', label: 'Nail Technician' },
        ],
    },
];
