<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// استدعاء مكتبة PhpSpreadsheet والاتصال بقاعدة البيانات
require_once '../../vendor/autoload.php';
include_once '../config/database.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

$database = new Database();
$db = $database->getConnection();

// تحديد نوع التقرير المطلوب
$type = isset($_GET['type']) ? $_GET['type'] : 'revenue';

// إعداد المتغيرات الأساسية
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setRightToLeft(true); // اتجاه الورقة من اليمين لليسار

$data = [];
$headers = [];
$title = "";
$fileName = "Report";

// --- جلب البيانات بناءً على نوع التقرير ---

if ($type == 'revenue') {
    $title = "تقرير الإيرادات المالية";
    $fileName = "Revenue_Report";
    $headers = ['#', 'التاريخ', 'العميل', 'المركبة', 'الخدمة', 'التكلفة الإجمالية', 'المدفوع', 'المتبقي', 'حالة الدفع'];
    
    $query = "SELECT s.date, c.name as customer_name, v.make, v.model, v.license_plate, s.type as service_type, s.cost, s.amount_paid, s.remaining_amount, s.payment_status 
              FROM services s 
              LEFT JOIN vehicles v ON s.vehicle_id = v.id 
              LEFT JOIN customers c ON v.customer_id = c.id 
              ORDER BY s.date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $i = 1;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $paymentStatusAr = match($row['payment_status']) {
            'paid' => 'مدفوع',
            'partial' => 'جزئي',
            'pending' => 'غير مدفوع',
            default => $row['payment_status']
        };
        
        $data[] = [
            $i++,
            $row['date'],
            $row['customer_name'],
            $row['make'] . ' ' . $row['model'] . ' (' . $row['license_plate'] . ')',
            $row['service_type'],
            $row['cost'],
            $row['amount_paid'],
            $row['remaining_amount'],
            $paymentStatusAr
        ];
    }

} elseif ($type == 'services') {
    $title = "سجل الخدمات والصيانة";
    $fileName = "Services_Report";
    $headers = ['#', 'التاريخ', 'المركبة', 'العميل', 'نوع الخدمة', 'الفني', 'الحالة', 'التكلفة'];
    
    $query = "SELECT s.*, v.make, v.model, v.license_plate, c.name as customer_name 
              FROM services s 
              LEFT JOIN vehicles v ON s.vehicle_id = v.id 
              LEFT JOIN customers c ON v.customer_id = c.id 
              ORDER BY s.date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $i = 1;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $statusAr = match($row['status']) {
            'completed' => 'مكتمل',
            'in_progress' => 'قيد التنفيذ',
            'pending' => 'قيد الانتظار',
            'cancelled' => 'ملغي',
            default => $row['status']
        };

        $data[] = [
            $i++,
            $row['date'],
            $row['make'] . ' ' . $row['model'],
            $row['customer_name'],
            $row['type'],
            $row['technician'],
            $statusAr,
            $row['cost']
        ];
    }

} elseif ($type == 'customers') {
    $title = "قائمة العملاء المسجلين";
    $fileName = "Customers_Report";
    $headers = ['#', 'اسم العميل', 'رقم الهاتف', 'البريد الإلكتروني', 'العنوان', 'تاريخ التسجيل'];
    
    $query = "SELECT * FROM customers ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $i = 1;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data[] = [
            $i++,
            $row['name'],
            $row['phone'],
            $row['email'],
            $row['address'],
            date('Y-m-d', strtotime($row['created_at']))
        ];
    }

} elseif ($type == 'vehicles') {
    $title = "قائمة المركبات";
    $fileName = "Vehicles_Report";
    $headers = ['#', 'الماركة', 'الموديل', 'السنة', 'رقم اللوحة', 'المالك', 'الحالة'];
    
    $query = "SELECT v.*, c.name as owner_name FROM vehicles v 
              LEFT JOIN customers c ON v.customer_id = c.id 
              ORDER BY v.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $i = 1;
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $statusAr = match($row['status']) {
            'in_service' => 'في الخدمة',
            'completed' => 'جاهزة',
            'pending' => 'انتظار',
            default => $row['status']
        };

        $data[] = [
            $i++,
            $row['make'],
            $row['model'],
            $row['year'],
            $row['license_plate'],
            $row['owner_name'],
            $statusAr
        ];
    }
}

// --- التنسيق الجمالي (Styling) ---

// 1. العنوان الرئيسي
$sheet->mergeCells('A1:' . chr(64 + count($headers)) . '2');
$sheet->setCellValue('A1', $title);
$titleStyle = [
    'font' => ['bold' => true, 'size' => 18, 'color' => ['argb' => 'FF2c3e50']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
];
$sheet->getStyle('A1')->applyFromArray($titleStyle);

// 2. تنسيق ترويسة الجدول
$headerRow = 4;
$sheet->fromArray($headers, NULL, 'A' . $headerRow);
$lastCol = $sheet->getHighestColumn();
$headerStyle = [
    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF'], 'size' => 12],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF3498db']], // لون أزرق احترافي
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF2980b9']]],
];
$sheet->getStyle('A' . $headerRow . ':' . $lastCol . $headerRow)->applyFromArray($headerStyle);
$sheet->getRowDimension($headerRow)->setRowHeight(25);

// 3. كتابة البيانات وتنسيقها
$startRow = 5;
if (!empty($data)) {
    $sheet->fromArray($data, NULL, 'A' . $startRow);
    $highestRow = $sheet->getHighestRow();
    
    // تنسيق عام للخلايا
    $dataStyle = [
        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFecf0f1']]],
        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'horizontal' => Alignment::HORIZONTAL_LEFT],
    ];
    $sheet->getStyle('A' . $startRow . ':' . $lastCol . $highestRow)->applyFromArray($dataStyle);
    
    // تلوين الصفوف (Zebra Striping)
    for ($row = $startRow; $row <= $highestRow; $row++) {
        if ($row % 2 == 0) {
            $sheet->getStyle('A' . $row . ':' . $lastCol . $row)
                  ->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFf7f9f9');
        }
    }
    
    // توسيط العمود الأول (الترقيم)
    $sheet->getStyle('A' . $startRow . ':A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

    // إضافة صف الإجماليات لتقرير الإيرادات
    if ($type == 'revenue') {
        $summaryRow = $highestRow + 1;
        $sheet->setCellValue('A' . $summaryRow, 'الإجمالي الكلي');
        $sheet->mergeCells('A' . $summaryRow . ':E' . $summaryRow); // دمج حتى عمود ما قبل التكلفة
        
        // معادلات الجمع
        $sheet->setCellValue('F' . $summaryRow, '=SUM(F' . $startRow . ':F' . $highestRow . ')'); // التكلفة
        $sheet->setCellValue('G' . $summaryRow, '=SUM(G' . $startRow . ':G' . $highestRow . ')'); // المدفوع
        $sheet->setCellValue('H' . $summaryRow, '=SUM(H' . $startRow . ':H' . $highestRow . ')'); // المتبقي
        
        // تنسيق صف الإجماليات
        $summaryStyle = [
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFecf0f1']],
            'borders' => ['top' => ['borderStyle' => Border::BORDER_DOUBLE, 'color' => ['argb' => 'FF34495e']]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A' . $summaryRow . ':' . $lastCol . $summaryRow)->applyFromArray($summaryStyle);
        
        // تنسيق العملة
        $sheet->getStyle('F' . $startRow . ':H' . $summaryRow)->getNumberFormat()->setFormatCode('#,##0.00');
    }
    
    // ضبط عرض الأعمدة تلقائياً
    foreach (range('A', $lastCol) as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }
}

// --- إخراج الملف ---
$finalFileName = $fileName . "_" . date('Y-m-d') . ".xlsx";
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="' . $finalFileName . '"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;