// import { useDoctors } from './doctors-provider'
// import { DoctorsAddDialog } from './doctors-add-dialog'
// import { DoctorsEditDialog } from './doctors-edit-dialog'
// 
// export function DoctorsDialogs() {
//   const { open, setOpen, currentRow, setCurrentRow } = useDoctors()
// 
//   return (
//     <>
//       <DoctorsAddDialog
//         open={open === 'add'}
//         onOpenChange={() => setOpen('add')}
//       />
// 
//       {currentRow && (
//         <DoctorsEditDialog
//           key={`doctor-edit-${currentRow.id}`}
//           open={open === 'edit'}
//           onOpenChange={() => {
//             setOpen('edit')
//             setTimeout(() => {
//               setCurrentRow(null)
//             }, 500)
//           }}
//           currentRow={currentRow}
//         />
//       )}
//     </>
//   )
// }
// 
