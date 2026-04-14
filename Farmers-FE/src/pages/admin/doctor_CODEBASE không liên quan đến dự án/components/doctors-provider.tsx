// import React, { useState } from 'react'
// import useDialogState from '@/shared/hooks/use-dialog-state'
// import { type Doctor } from '../data/doctors.ts'
// 
// type DoctorsDialogType = 'add' | 'edit' | 'delete'
// 
// type DoctorsContextType = {
//   open: DoctorsDialogType | null
//   setOpen: (str: DoctorsDialogType | null) => void
//   currentRow: Doctor | null
//   setCurrentRow: React.Dispatch<React.SetStateAction<Doctor | null>>
// }
// 
// const DoctorsContext = React.createContext<DoctorsContextType | null>(null)
// 
// export function DoctorsProvider({ children }: { children: React.ReactNode }) {
//   const [open, setOpen] = useDialogState<DoctorsDialogType>(null)
//   const [currentRow, setCurrentRow] = useState<Doctor | null>(null)
// 
//   return (
//     <DoctorsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
//       {children}
//     </DoctorsContext>
//   )
// }
// 
// // eslint-disable-next-line react-refresh/only-export-components
// export const useDoctors = () => {
//   const doctorsContext = React.useContext(DoctorsContext)
// 
//   if (!doctorsContext) {
//     throw new Error('useDoctors has to be used within <DoctorsContext>')
//   }
// 
//   return doctorsContext
// }
