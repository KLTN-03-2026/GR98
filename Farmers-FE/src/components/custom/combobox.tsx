'use client'

import React, { useState, forwardRef, type JSX, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

// Thêm hàm debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface IComboboxProps {
  className?: string
  label?: string
  dataArr: { value: string; label: string }[]
  dialogEdit?: React.ReactNode
  setOpenEditDialog?: React.Dispatch<React.SetStateAction<boolean>>
  onValueSelect?: (value: string | string[]) => void
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  contentTrigger?: JSX.Element
  variantTrigger?: any
  variant?: 'normal' | 'bigsize'
  isMultiSelect?: boolean
  disabled?: boolean,
  isNullableSelect?: boolean,
  setSearchGlobal?: (value: string) => void
  debounceTime?: number
}

function SelectedItemsPanel({
  items,
  dataArr,
  onDelete,
}: {
  items: string[]
  dataArr: { value: string; label: string }[]
  onDelete: (value: string) => void
}) {
  if (!items.length) return ''

  return (
    <div className='flex w-[220px] flex-col ml-2 border-l mt-3 px-2'>
      <div className='border-b px-4'>
        <div className='mb-2 flex items-center justify-between'>
          <h4 className='text-sm font-medium'>Selected ({items.length})</h4>
        </div>
      </div>

      <ScrollArea className='h-[250px]'>
        <div className='space-y-1 p-4 pt-0'>
          {items.map((value) => {
            const item = dataArr.find(d => d.value === value)
            if (!item) return null
            return (
              <Button
                key={value}
                variant='ghost'
                className='group flex h-9 w-full items-center justify-between px-2 transition-colors hover:bg-muted'
                onClick={() => onDelete(value)}
              >
                <span className='text-sm'>{item.label}</span>
                <span className='text-muted-foreground transition-colors group-hover:text-foreground'>×</span>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

export const Combobox = forwardRef<HTMLButtonElement, IComboboxProps>(
  (
    {
      contentTrigger,
      variantTrigger,
      variant = 'normal',
      className,
      label,
      dataArr,
      dialogEdit,
      setOpenEditDialog,
      onValueSelect,
      value: controlledValue,
      onChange,
      isMultiSelect = false,
      disabled = false,
      isNullableSelect = false,
      setSearchGlobal,
      debounceTime = 300,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const debouncedSearchValue = useDebounce(searchValue, debounceTime);
    const [selectedValues, setSelectedValues] = useState<string[]>(
      isMultiSelect ? (Array.isArray(controlledValue) ? controlledValue : []) : []
    )

    const sizeClass = variant === 'bigsize' ? 'h-12' : 'h-10'

    useEffect(() => {
      const isDefaultSearchGlobal = setSearchGlobal === undefined || setSearchGlobal === null;
      if (!isDefaultSearchGlobal) {
        setSearchGlobal(debouncedSearchValue.trim())
      }
    }, [debouncedSearchValue, setSearchGlobal]);

    const filteredDataArr = [
      ...(isMultiSelect ? [] : (isNullableSelect ? [
        { value: 'null', label: 'Clear selection' }
      ] : [])),
      ...(dataArr?.filter((data) =>
        searchValue.trim() === '' || data.label.toLowerCase().includes(searchValue.trim().toLowerCase())
      ) || [])
    ]

    // Xử lý khi giá trị search thay đổi
    const handleSearchChange = (value: string) => {
      setSearchValue(value)
    }

    const handleSelect = (currentValue: string) => {
      let newValue: string | string[]

      if (isMultiSelect) {
        const newValues = selectedValues.includes(currentValue as string)
          ? selectedValues.filter(v => v !== currentValue)
          : [...selectedValues, currentValue as string]
        setSelectedValues(newValues)
        newValue = newValues
      } else {
        newValue = currentValue
        setOpen(false)
      }

      if (onChange) {
        onChange(newValue)
      }
      if (onValueSelect) {
        onValueSelect(newValue)
      }

      setSearchValue('')
    }

    const getDisplayValue = () => {
      if (isMultiSelect) {
        const selected = Array.isArray(controlledValue) ? controlledValue : selectedValues
        if (selected.length === 0) return `Select ${label ?? 'item'}`
        return `${selected.length} items selected`
      }

      const foundData = dataArr.find((data) => data.value === controlledValue)
      return foundData && foundData.label?.length > 30
        ? foundData.label.substring(0, 40) + '...'
        : foundData?.label ?? `Select ${label ?? 'item'}`
    }

    return (
      <div className={cn(className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant={variantTrigger ?? 'outline'}
              aria-expanded={open}
              className={cn(className, 'w-full justify-between px-2', sizeClass)}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {contentTrigger ? (
                contentTrigger
              ) : (
                <>
                  <span className='ml-1 text-sm overflow-hidden'>
                    <span className="inline-block whitespace-nowrap hover:animate-marquee">
                      {getDisplayValue()}
                    </span>
                  </span>
                  <ChevronsUpDown className='mx-2 h-3 w-3 shrink-0 opacity-50' />
                </>
              )}
            </Button>
          </PopoverTrigger>
          <ScrollArea className='w-full'>
            <PopoverContent
              className={cn('w-full min-w-[450px] p-3', className)}
              inPortal={false}
              sideOffset={6}
              style={{ width: '100%' }}
            >
              <div className='flex'>
                <div className='flex-1'>
                  <Command shouldFilter={false}>
                    <CommandInput
                      value={searchValue}
                      onValueChange={handleSearchChange}
                      placeholder={`Search ${label ?? 'item'}`}
                    />
                    <CommandList>
                      {filteredDataArr?.length > 0 ? (
                        <CommandGroup>
                          {filteredDataArr?.map((data) => (
                            <CommandItem key={data.value} value={data.value} onSelect={() => handleSelect(data.value)}>
                              <div className='flex w-full justify-between'>
                                {data.label}
                                <Check
                                  className={cn('h-4 w-4',
                                    isMultiSelect
                                      ? (selectedValues.includes(data.value) ? 'opacity-100' : 'opacity-0')
                                      : (controlledValue === data.value ? 'opacity-100' : 'opacity-0')
                                  )}
                                />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : (
                        <CommandEmpty>No items found</CommandEmpty>
                      )}
                    </CommandList>
                  </Command>

                  {setOpenEditDialog && (
                    <Button
                      className='mt-4 w-full'
                      variant='outline'
                      onClick={() => setOpenEditDialog(true)}
                    >
                      Edit {label ?? 'item'}
                    </Button>
                  )}
                </div>

                {isMultiSelect && (
                  <SelectedItemsPanel
                    items={selectedValues}
                    dataArr={dataArr}
                    onDelete={(valueToDelete) => {
                      const newValues = selectedValues.filter(v => v !== valueToDelete)
                      setSelectedValues(newValues)
                      if (onChange) onChange(newValues)
                      if (onValueSelect) onValueSelect(newValues)
                    }}
                  />
                )}
              </div>
            </PopoverContent>
          </ScrollArea>
        </Popover>
        {dialogEdit}
      </div>
    )
  }
)

Combobox.displayName = 'Combobox'
