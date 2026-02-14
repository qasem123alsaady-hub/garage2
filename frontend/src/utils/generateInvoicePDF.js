import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Amiri_Regular } from '../assets/fonts/Amiri-Regular-normal'; // ✅ استيراد الخط العربي

export const generatePurchaseInvoicePDF = (invoice, supplier, t) => {
  if (!invoice) return;

  const doc = new jsPDF();

  // إضافة الخط العربي لدعم اللغة العربية في الـ PDF
  doc.addFileToVFS('Amiri-Regular.ttf', Amiri_Regular);
  doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  doc.setFont('Amiri');

  // تفعيل دعم الكتابة من اليمين لليسار
  doc.setRTL(true);

  // رأس الفاتورة
  doc.setFontSize(20);
  doc.text(t('purchaseInvoices') || 'فاتورة شراء', 105, 20, { align: 'center' });

  // تفاصيل الفاتورة
  doc.setFontSize(12);
  const startY = 40;
  doc.text(`${t('invoiceNumber') || 'رقم الفاتورة'}: ${invoice.invoice_number || ''}`, 195, startY, { align: 'right' });
  doc.text(`${t('invoiceDate') || 'تاريخ الفاتورة'}: ${new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}`, 195, startY + 10, { align: 'right' });
  doc.text(`${t('selectSupplier') || 'المورد'}: ${supplier ? supplier.name : 'غير محدد'}`, 195, startY + 20, { align: 'right' });
  doc.text(`${t('invoiceAmount') || 'مبلغ الفاتورة'}: ${invoice.amount}`, 195, startY + 30, { align: 'right' });

  // خط فاصل
  doc.setLineWidth(0.5);
  doc.line(15, startY + 40, 195, startY + 40);

  // محتويات الفاتورة
  doc.setFontSize(14);
  doc.text(t('invoiceItems') || 'محتويات الفاتورة', 195, startY + 50, { align: 'right' });
  doc.setFontSize(12);
  const itemsText = doc.splitTextToSize(invoice.items || '', 180);
  doc.text(itemsText, 195, startY + 60, { align: 'right' });

  // تذييل الفاتورة
  doc.setFontSize(10);
  doc.text('--- شكراً لتعاملكم معنا ---', 105, 280, { align: 'center' });

  // حفظ الملف
  doc.save(`Invoice-${invoice.invoice_number || invoice.id}.pdf`);
};