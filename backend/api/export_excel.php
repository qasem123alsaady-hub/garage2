<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/vnd.ms-excel; charset=UTF-8");
header("Content-Disposition: attachment; filename=garage_report_" . date('Y-m-d') . ".xls");
header("Pragma: no-cache");
header("Expires: 0");

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    die("Database connection failed");
}

// 1. استلام اللغة من الرابط (الافتراضي: عربي)
$lang = isset($_GET['lang']) && $_GET['lang'] === 'en' ? 'en' : 'ar';
$isRtl = ($lang === 'ar');
$reportType = isset($_GET['report_type']) ? $_GET['report_type'] : 'general';

// استلام التواريخ
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : null;
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : null;

// 2. مصفوفة الترجمات
$translations = [
    'ar' => [
        'overview' => 'تقرير',
        'report_period' => 'فترة التقرير',
        'from' => 'من',
        'to' => 'إلى',
        'all_periods' => 'كل الفترات',
        'completed_revenue' => 'الإيرادات المكتملة',
        'pending_revenue' => 'الإيرادات المعلقة',
        'report_date' => 'تاريخ التقرير',
        'generated_on' => 'تم الإنشاء في',
        'total_amount' => 'المجموع',
        'guardian' => 'ولي الأمر',
        'customer_phone' => 'رقم العميل',
        'phone' => 'الهاتف',
        'full_entitlements' => 'كامل الاستحقاقات',
        'total_revenue_summary' => 'إجمالي الإيرادات',
        'total_paid_summary' => 'إجمالي الإيرادات المدفوعة',
        'total_pending_summary' => 'إجمالي الإيرادات المعلقة',
        'invoices_report' => 'تقرير الفواتير',
        'receipts_report' => 'تقرير المقبوضات',
        'payments_report' => 'تقرير المدفوعات',
        'suppliers_report' => 'تقرير الموردين',
        // Headers
        'id' => 'المعرف',
        'vehicle' => 'المركبة',
        'customer' => 'العميل',
        'type' => 'نوع الخدمة',
        'description' => 'الوصف',
        'technician' => 'الفني',
        'date' => 'التاريخ',
        'cost' => 'التكلفة',
        'paid' => 'المدفوع',
        'remaining' => 'المتبقي',
        'status' => 'الحالة',
        'payment_status' => 'حالة الدفع',
        'payment_method' => 'طريقة الدفع',
        'transaction_id' => 'رقم المعاملة',
        'amount' => 'المبلغ',
        'invoice_number' => 'رقم الفاتورة',
        'supplier' => 'المورد',
        // قيم الحالات
        'pending' => 'قيد الانتظار',
        'in-service' => 'قيد الخدمة',
        'completed' => 'مكتمل',
        'partial' => 'جزئي',
        'paid_status' => 'مدفوع',
        'unpaid' => 'غير مدفوع',
        'cash' => 'نقدي', 'card' => 'بطاقة', 'transfer' => 'تحويل', 'check' => 'شيك'
    ],
    'en' => [
        'overview' => 'Report',
        'report_period' => 'Report Period',
        'from' => 'From',
        'to' => 'To',
        'all_periods' => 'All Periods',
        'completed_revenue' => 'Completed Revenue',
        'pending_revenue' => 'Pending Revenue',
        'report_date' => 'Report Date',
        'generated_on' => 'Generated On',
        'total_amount' => 'Total',
        'guardian' => 'Guardian/Customer',
        'customer_phone' => 'Customer Phone',
        'phone' => 'Phone',
        'full_entitlements' => 'Total Due',
        'total_revenue_summary' => 'Total Revenue',
        'total_paid_summary' => 'Total Paid Revenue',
        'total_pending_summary' => 'Total Pending Revenue',
        'invoices_report' => 'Invoices Report',
        'receipts_report' => 'Receipts Report',
        'payments_report' => 'Payments Report',
        'suppliers_report' => 'Suppliers Report',
        // Headers
        'id' => 'ID',
        'vehicle' => 'Vehicle',
        'customer' => 'Customer',
        'type' => 'Service Type',
        'description' => 'Description',
        'technician' => 'Technician',
        'date' => 'Date',
        'cost' => 'Cost',
        'paid' => 'Paid',
        'remaining' => 'Remaining',
        'status' => 'Status',
        'payment_status' => 'Payment Status',
        'payment_method' => 'Payment Method',
        'transaction_id' => 'Transaction ID',
        'amount' => 'Amount',
        'invoice_number' => 'Invoice Number',
        'supplier' => 'Supplier',
        // Status values
        'pending' => 'Pending',
        'in-service' => 'In Service',
        'completed' => 'Completed',
        'partial' => 'Partial',
        'paid_status' => 'Paid',
        'unpaid' => 'Unpaid',
        'cash' => 'Cash', 'card' => 'Card', 'transfer' => 'Transfer', 'check' => 'Check'
    ]
];

// استلام الفلاتر المحددة
$customerId = isset($_GET['customer_id']) ? $_GET['customer_id'] : null;
$vehicleId = isset($_GET['vehicle_id']) ? $_GET['vehicle_id'] : null;

// اختيار الترجمة المناسبة
$tr = $translations[$lang];

// جلب البيانات
if ($reportType === 'fund') {
    // استعلام الصندوق (كل الحركات)
    $query_in = "SELECT p.*, 'in' as trans_type, c.name as entity_name 
                 FROM payments p 
                 LEFT JOIN services s ON p.service_id = s.id 
                 LEFT JOIN vehicles v ON s.vehicle_id = v.id 
                 LEFT JOIN customers c ON v.customer_id = c.id
                 WHERE 1=1";
    $query_out = "SELECT pp.*, 'out' as trans_type, sup.name as entity_name 
                  FROM purchase_payments pp 
                  LEFT JOIN purchase_invoices pi ON pp.invoice_id = pi.id 
                  LEFT JOIN suppliers sup ON pi.supplier_id = sup.id
                  WHERE 1=1";
    
    $params = [];
    if ($startDate) {
        $query_in .= " AND DATE(p.payment_date) >= :start_date";
        $query_out .= " AND DATE(pp.payment_date) >= :start_date";
        $params[':start_date'] = $startDate;
    }
    if ($endDate) {
        $query_in .= " AND DATE(p.payment_date) <= :end_date";
        $query_out .= " AND DATE(pp.payment_date) <= :end_date";
        $params[':end_date'] = $endDate;
    }

    $stmt_in = $db->prepare($query_in);
    $stmt_in->execute($params);
    $in_data = $stmt_in->fetchAll(PDO::FETCH_ASSOC);

    $stmt_out = $db->prepare($query_out);
    $stmt_out->execute($params);
    $out_data = $stmt_out->fetchAll(PDO::FETCH_ASSOC);

    $fundData = array_merge($in_data, $out_data);
    usort($fundData, function($a, $b) {
        return strtotime($b['payment_date']) - strtotime($a['payment_date']);
    });

} elseif ($reportType === 'receipts') {
    // ... (existing receipts query remains same)
    $query = "SELECT p.*, s.type as service_type, v.make, v.model, v.license_plate, c.name as customer_name, c.phone as customer_phone 
              FROM payments p 
              LEFT JOIN services s ON p.service_id = s.id 
              LEFT JOIN vehicles v ON s.vehicle_id = v.id 
              LEFT JOIN customers c ON v.customer_id = c.id
              WHERE 1=1";
    
    $params = [];
    if ($startDate) { $query .= " AND DATE(p.payment_date) >= :start_date"; $params[':start_date'] = $startDate; }
    if ($endDate) { $query .= " AND DATE(p.payment_date) <= :end_date"; $params[':end_date'] = $endDate; }
    
    $query .= " ORDER BY p.payment_date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $receiptsData = $stmt->fetchAll(PDO::FETCH_ASSOC);

} elseif ($reportType === 'payments') {
    $query = "SELECT pp.*, pi.invoice_number, s.name as supplier_name 
              FROM purchase_payments pp 
              LEFT JOIN purchase_invoices pi ON pp.invoice_id = pi.id 
              LEFT JOIN suppliers s ON pi.supplier_id = s.id
              WHERE 1=1";
    
    $params = [];
    if ($startDate) { $query .= " AND DATE(pp.payment_date) >= :start_date"; $params[':start_date'] = $startDate; }
    if ($endDate) { $query .= " AND DATE(pp.payment_date) <= :end_date"; $params[':end_date'] = $endDate; }
    
    $query .= " ORDER BY pp.payment_date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $paymentsData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} elseif ($reportType === 'suppliers') {
    $query = "SELECT pi.*, s.name as supplier_name, s.contact_person, s.phone as supplier_phone 
              FROM purchase_invoices pi 
              LEFT JOIN suppliers s ON pi.supplier_id = s.id
              WHERE 1=1";
    
    $params = [];
    if ($startDate) { $query .= " AND pi.invoice_date >= :start_date"; $params[':start_date'] = $startDate; }
    if ($endDate) { $query .= " AND pi.invoice_date <= :end_date"; $params[':end_date'] = $endDate; }
    
    $query .= " ORDER BY pi.invoice_date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $suppliersData = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
    // General / Invoices
    $query = "SELECT s.*, v.make, v.model, v.license_plate, c.name as customer_name, c.phone as customer_phone 
              FROM services s 
              LEFT JOIN vehicles v ON s.vehicle_id = v.id 
              LEFT JOIN customers c ON v.customer_id = c.id
              WHERE 1=1";

    $params = [];
    if ($startDate) { $query .= " AND s.date >= :start_date"; $params[':start_date'] = $startDate; }
    if ($endDate) { $query .= " AND s.date <= :end_date"; $params[':end_date'] = $endDate; }

    $query .= " ORDER BY s.date DESC";
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $allServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $completedServices = [];
    $pendingServices = [];
    $customerSummary = [];

    foreach ($allServices as $row) {
        if ($row['payment_status'] === 'paid' || floatval($row['remaining_amount']) <= 0) {
            $completedServices[] = $row;
        } else {
            $pendingServices[] = $row;
        }
        $key = ($row['customer_name'] ?? 'Unknown') . '_' . ($row['customer_phone'] ?? '');
        if (!isset($customerSummary[$key])) {
            $customerSummary[$key] = ['name' => $row['customer_name'], 'phone' => $row['customer_phone'], 'cost' => 0, 'paid' => 0, 'remaining' => 0];
        }
        $customerSummary[$key]['cost'] += floatval($row['cost']);
        $customerSummary[$key]['paid'] += floatval($row['amount_paid']);
        $customerSummary[$key]['remaining'] += floatval($row['remaining_amount']);
    }
}

// دوال مساعدة
function xml_escape($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

function get_status_text($status, $tr) {
    return isset($tr[$status]) ? $tr[$status] : $status;
}

function get_payment_status_text($status, $tr) {
    if($status == 'paid') $key = 'paid_status';
    elseif($status == 'pending') $key = 'unpaid';
    else $key = $status;
    return isset($tr[$key]) ? $tr[$key] : $status;
}

function get_payment_method_text($method, $tr) {
    return isset($tr[$method]) ? $tr[$method] : $method;
}

// بداية ملف XML
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<?mso-application progid="Excel.Sheet"?>';
?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="sData">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="sTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#2F5597"/>
  </Style>
  <Style ss:ID="sSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#595959"/>
  </Style>
  <Style ss:ID="sCurrency">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
    </Borders>
    <NumberFormat ss:Format="Standard"/>
  </Style>
  <Style ss:ID="sTotal">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    <Borders>
        <Border ss:Position="Top" ss:LineStyle="Double" ss:Weight="3"/>
    </Borders>
    <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1"/>
    <Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/>
    <NumberFormat ss:Format="Standard"/>
  </Style>
  <Style ss:ID="sSummaryLabel">
   <Alignment ss:Horizontal="<?php echo $isRtl ? 'Right' : 'Left'; ?>" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="sSummaryValue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#000000"/>
   <NumberFormat ss:Format="Standard"/>
  </Style>
 </Styles>

 <?php
 // دالة لرسم ورقة التقرير الملخص (Sheet 1)
 function renderSummaryWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalCost = 0;
    $totalPaid = 0;
    $totalRemaining = 0;
    foreach ($data as $row) {
        $totalCost += $row['cost'];
        $totalPaid += $row['paid'];
        $totalRemaining += $row['remaining'];
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="5" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="200"/> <!-- Guardian -->
   <Column ss:Width="120"/> <!-- Phone -->
   <Column ss:Width="100"/> <!-- Cost -->
   <Column ss:Width="100"/> <!-- Paid -->
   <Column ss:Width="100"/> <!-- Remaining -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="4" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="4" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php 
        $periodStr = "";
        if($startDate && $endDate) {
            $periodStr = $tr['from'] . " " . $startDate . " " . $tr['to'] . " " . $endDate;
        } else if ($startDate) {
             $periodStr = $tr['from'] . " " . $startDate;
        } else if ($endDate) {
             $periodStr = $tr['to'] . " " . $endDate;
        } else {
            $periodStr = $tr['all_periods'];
        }
        echo $tr['report_period'] . ": " . $periodStr;
    ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="4" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   
   <Row ss:Height="10"/>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="1" ss:StyleID="sSummaryLabel"><Data ss:Type="String"><?php echo $tr['total_revenue_summary']; ?></Data></Cell>
    <Cell ss:StyleID="sSummaryValue"><Data ss:Type="Number"><?php echo floatval($totalCost); ?></Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="1" ss:StyleID="sSummaryLabel"><Data ss:Type="String"><?php echo $tr['total_paid_summary']; ?></Data></Cell>
    <Cell ss:StyleID="sSummaryValue"><Data ss:Type="Number"><?php echo floatval($totalPaid); ?></Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="1" ss:StyleID="sSummaryLabel"><Data ss:Type="String"><?php echo $tr['total_pending_summary']; ?></Data></Cell>
    <Cell ss:StyleID="sSummaryValue"><Data ss:Type="Number"><?php echo floatval($totalRemaining); ?></Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['guardian']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['customer_phone']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['full_entitlements']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['paid']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['remaining']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['phone']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['cost']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['paid']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['remaining']); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="1" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"/>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalCost); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalPaid); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalRemaining); ?></Data></Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Print>
    <ValidPrinterInfo/>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
     <ActiveRow>4</ActiveRow>
     <ActiveCol>1</ActiveCol>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
   <?php if($isRtl): ?>
   <DisplayRightToLeft/>
   <?php endif; ?>
  </WorksheetOptions>
 </Worksheet>
 <?php }

 // دالة لرسم ورقة عمل (Sheet)
 function renderWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalCost = 0;
    $totalPaid = 0;
    $totalRemaining = 0;
    foreach ($data as $row) {
        $totalCost += floatval($row['cost']);
        $totalPaid += floatval($row['amount_paid']);
        $totalRemaining += floatval($row['remaining_amount']);
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="12" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="40"/> <!-- ID -->
   <Column ss:Width="150"/> <!-- Vehicle -->
   <Column ss:Width="120"/> <!-- Customer -->
   <Column ss:Width="100"/> <!-- Type -->
   <Column ss:Width="200"/> <!-- Description -->
   <Column ss:Width="100"/> <!-- Technician -->
   <Column ss:Width="80"/> <!-- Date -->
   <Column ss:Width="80"/> <!-- Cost -->
   <Column ss:Width="80"/> <!-- Paid -->
   <Column ss:Width="80"/> <!-- Remaining -->
   <Column ss:Width="80"/> <!-- Status -->
   <Column ss:Width="100"/> <!-- Payment Status -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="11" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="11" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php 
        $periodStr = "";
        if($startDate && $endDate) {
            $periodStr = $tr['from'] . " " . $startDate . " " . $tr['to'] . " " . $endDate;
        } else if ($startDate) {
             $periodStr = $tr['from'] . " " . $startDate;
        } else if ($endDate) {
             $periodStr = $tr['to'] . " " . $endDate;
        } else {
            $periodStr = $tr['all_periods'];
        }
        echo $tr['report_period'] . ": " . $periodStr;
    ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="11" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   <Row ss:Index="5">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['id']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['vehicle']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['customer']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['type']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['description']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['technician']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['date']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['cost']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['paid']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['remaining']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['status']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['payment_status']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['id']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['make'] . ' ' . $row['model'] . ' (' . $row['license_plate'] . ')'); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['customer_name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_status_text($row['type'], $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['description']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['technician']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['date']; ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['cost']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['amount_paid']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['remaining_amount']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_status_text($row['status'], $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_payment_status_text($row['payment_status'], $tr)); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="7" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalCost); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalPaid); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalRemaining); ?></Data></Cell>
   </Row>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
    <PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>
   </PageSetup>
   <Print>
    <ValidPrinterInfo/>
    <HorizontalResolution>600</HorizontalResolution>
    <VerticalResolution>600</VerticalResolution>
   </Print>
   <Selected/>
   <Panes>
    <Pane>
     <Number>3</Number>
     <ActiveRow>4</ActiveRow>
     <ActiveCol>1</ActiveCol>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
   <?php if($isRtl): ?>
   <DisplayRightToLeft/>
   <?php endif; ?>
  </WorksheetOptions>
 </Worksheet>
 <?php } 

 // دالة لرسم ورقة الإيصالات (Receipts)
 function renderReceiptsWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalAmount = 0;
    foreach ($data as $row) {
        $totalAmount += floatval($row['amount']);
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="9" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="60"/> <!-- ID -->
   <Column ss:Width="100"/> <!-- Date -->
   <Column ss:Width="120"/> <!-- Customer -->
   <Column ss:Width="150"/> <!-- Vehicle -->
   <Column ss:Width="100"/> <!-- Service Type -->
   <Column ss:Width="80"/> <!-- Amount -->
   <Column ss:Width="80"/> <!-- Method -->
   <Column ss:Width="100"/> <!-- Transaction ID -->
   <Column ss:Width="150"/> <!-- Notes -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="8" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="8" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   <Row ss:Index="4">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['id']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['date']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['customer']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['vehicle']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['type']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['amount']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['payment_method']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['transaction_id']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['description']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['id']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['payment_date']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['customer_name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['make'] . ' ' . $row['model']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_status_text($row['service_type'], $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['amount']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_payment_method_text($row['payment_method'], $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['transaction_id']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['notes']); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="5" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalAmount); ?></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
 <?php }
 
 // دالة لرسم ورقة المدفوعات (Payments)
 function renderPaymentsWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalAmount = 0;
    foreach ($data as $row) {
        $totalAmount += floatval($row['amount']);
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="7" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="60"/> <!-- ID -->
   <Column ss:Width="100"/> <!-- Date -->
   <Column ss:Width="150"/> <!-- Supplier -->
   <Column ss:Width="100"/> <!-- Invoice Number -->
   <Column ss:Width="80"/> <!-- Amount -->
   <Column ss:Width="80"/> <!-- Method -->
   <Column ss:Width="150"/> <!-- Notes -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="6" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="6" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   <Row ss:Index="4">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['id']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['date']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['supplier']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['invoice_number']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['amount']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['payment_method']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['description']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['id']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['payment_date']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['supplier_name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['invoice_number']); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['amount']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_payment_method_text($row['payment_method'] ?? '', $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['notes']); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="4" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalAmount); ?></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
 <?php }

 // دالة لرسم ورقة الموردين (Suppliers)
 function renderSuppliersWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalAmount = 0;
    $totalPaid = 0;
    $totalRemaining = 0;
    
    foreach ($data as $row) {
        $amount = floatval($row['amount'] ?? 0);
        $paid = floatval($row['paid_amount'] ?? 0);
        $remaining = $amount - $paid;
        
        $totalAmount += $amount;
        $totalPaid += $paid;
        $totalRemaining += $remaining;
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="10" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="40"/> <!-- ID -->
   <Column ss:Width="100"/> <!-- Invoice Number -->
   <Column ss:Width="150"/> <!-- Supplier -->
   <Column ss:Width="100"/> <!-- Phone -->
   <Column ss:Width="80"/> <!-- Date -->
   <Column ss:Width="80"/> <!-- Amount -->
   <Column ss:Width="80"/> <!-- Paid -->
   <Column ss:Width="80"/> <!-- Remaining -->
   <Column ss:Width="80"/> <!-- Status -->
   <Column ss:Width="200"/> <!-- Items -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="9" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="9" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php 
        $periodStr = "";
        if($startDate && $endDate) {
            $periodStr = $tr['from'] . " " . $startDate . " " . $tr['to'] . " " . $endDate;
        } else if ($startDate) {
             $periodStr = $tr['from'] . " " . $startDate;
        } else if ($endDate) {
             $periodStr = $tr['to'] . " " . $endDate;
        } else {
            $periodStr = $tr['all_periods'];
        }
        echo $tr['report_period'] . ": " . $periodStr;
    ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="9" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   <Row ss:Index="5">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['id']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['invoice_number']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['supplier']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['phone']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['date']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['amount']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['paid']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['remaining']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['status']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['description']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): 
       $amount = floatval($row['amount'] ?? 0);
       $paid = floatval($row['paid_amount'] ?? 0);
       $remaining = $amount - $paid;
   ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['id']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['invoice_number']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['supplier_name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['supplier_phone'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['invoice_date']; ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo $amount; ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo $paid; ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo $remaining; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape(get_payment_status_text($row['status'], $tr)); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['items']); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="5" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalAmount); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalPaid); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalRemaining); ?></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
 <?php }

 // دالة لرسم ورقة الصندوق (Fund)
 function renderFundWorksheet($title, $data, $tr, $isRtl, $startDate, $endDate) {
    $totalIn = 0;
    $totalOut = 0;
    foreach ($data as $row) {
        if ($row['trans_type'] === 'in') $totalIn += floatval($row['amount']);
        else $totalOut += floatval($row['amount']);
    }
 ?>
 <Worksheet ss:Name="<?php echo xml_escape($title); ?>">
  <Table ss:ExpandedColumnCount="6" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60" ss:DefaultRowHeight="15">
   <Column ss:Width="100"/> <!-- Date -->
   <Column ss:Width="150"/> <!-- Entity -->
   <Column ss:Width="80"/> <!-- Type -->
   <Column ss:Width="80"/> <!-- In -->
   <Column ss:Width="80"/> <!-- Out -->
   <Column ss:Width="150"/> <!-- Notes -->

   <Row ss:Height="25">
    <Cell ss:MergeAcross="5" ss:StyleID="sTitle"><Data ss:Type="String"><?php echo xml_escape($title); ?></Data></Cell>
   </Row>
   <Row ss:Height="15">
    <Cell ss:MergeAcross="5" ss:StyleID="sSubtitle"><Data ss:Type="String"><?php echo $tr['generated_on'] . ': ' . date('Y-m-d H:i'); ?></Data></Cell>
   </Row>
   <Row ss:Index="4">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['date']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $isRtl ? 'الجهة' : 'Entity'; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['type']; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $isRtl ? 'وارد' : 'Income'; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $isRtl ? 'صادر' : 'Expense'; ?></Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String"><?php echo $tr['description']; ?></Data></Cell>
   </Row>
   <?php foreach($data as $row): ?>
   <Row>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['payment_date']; ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['entity_name']); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo $row['trans_type'] === 'in' ? ($isRtl ? 'قبض' : 'Receipt') : ($isRtl ? 'صرف' : 'Payment'); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['trans_type'] === 'in' ? $row['amount'] : 0); ?></Data></Cell>
    <Cell ss:StyleID="sCurrency"><Data ss:Type="Number"><?php echo floatval($row['trans_type'] === 'out' ? $row['amount'] : 0); ?></Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"><?php echo xml_escape($row['notes']); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
   <Row>
       <Cell ss:Index="3" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $tr['total_amount']; ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalIn); ?></Data></Cell>
       <Cell ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalOut); ?></Data></Cell>
   </Row>
   <Row>
       <Cell ss:Index="3" ss:StyleID="sTotal"><Data ss:Type="String"><?php echo $isRtl ? 'الرصيد الحالي' : 'Current Balance'; ?></Data></Cell>
       <Cell ss:MergeAcross="1" ss:StyleID="sTotal"><Data ss:Type="Number"><?php echo floatval($totalIn - $totalOut); ?></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
 <?php }

 // إنشاء الصفحات بناءً على النوع
 if ($reportType === 'receipts') {
     renderReceiptsWorksheet($tr['receipts_report'], $receiptsData, $tr, $isRtl, $startDate, $endDate);
 } elseif ($reportType === 'payments') {
     renderPaymentsWorksheet($tr['payments_report'], $paymentsData, $tr, $isRtl, $startDate, $endDate);
 } elseif ($reportType === 'suppliers') {
     renderSuppliersWorksheet($tr['suppliers_report'], $suppliersData, $tr, $isRtl, $startDate, $endDate);
 } elseif ($reportType === 'fund') {
     renderFundWorksheet($isRtl ? 'تقرير الصندوق' : 'Fund Report', $fundData, $tr, $isRtl, $startDate, $endDate);
 } elseif ($reportType === 'invoices') {
     renderWorksheet($tr['invoices_report'], $allServices, $tr, $isRtl, $startDate, $endDate);
 } else {
     renderSummaryWorksheet($tr['overview'], $customerSummary, $tr, $isRtl, $startDate, $endDate);
     renderWorksheet($tr['completed_revenue'], $completedServices, $tr, $isRtl, $startDate, $endDate);
     renderWorksheet($tr['pending_revenue'], $pendingServices, $tr, $isRtl, $startDate, $endDate);
 }
 ?>
</Workbook>