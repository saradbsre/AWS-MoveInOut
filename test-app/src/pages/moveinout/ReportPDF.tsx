import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDateShort } from '@/utils/DateFormat';
import { SelectedItem } from '@/components/moveinoutcomponents/EquipmentSection';
import ReportHeader from '@/assets/bsreheader.png';
import { formatDateTimeLong } from '@/utils/DateFormat';

interface ReportData {
  building: string;
  unit: string;
  tenant: string;
  contractNo: string;
  startDate: string;
  endDate: string;
  visitType: string;
  submissionDate: Date;
  tenantSignature: string; // base64 or URL
  technicianSignature: string; // base64 or URL
  images: number;
  videos: number;
}

interface ReportPDFProps {
  reportData: ReportData;
  selectedEquipment: SelectedItem[];
  username?: string;
  barcodeBase64?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    paddingTop: 20,
    fontSize: 8,
    paddingBottom: 50,
    fontFamily: 'Times-Roman',
  },
  headerImage: {
    width: '100%',
    height: 120,
    objectFit: 'contain', 
    marginBottom: 12,
  },
  content: {
    paddingLeft: 19,
    paddingRight: 19, // Or whatever padding you want for the content
    paddingBottom: 50,
  },
  titleBarcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barcode: {
    width: 180,
    height: 40,
    marginLeft: 12,
    alignSelf: 'flex-end',
    marginBottom: 0, // override if needed
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    fontFamily: 'Times-Roman',
  },
  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    marginTop: 18,
    marginBottom: 6,
    textDecoration: 'underline',
    fontFamily: 'Times-Roman',
  },
  row: {
    flexDirection: 'row',
     borderBottomWidth: 1,
  borderColor: '#000',
  },
cell: {
  padding: 4,
  fontFamily: 'Times-Roman',
  fontSize: 8,
},
  boldBlack: {
    fontWeight: 'bold',
    color: '#000',
  },
  label: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  col5: { width: '5%' },   // Add this new style
  col10: { width: '10%' },
  col20: { width: '20%' },
  col25: { width: '25%' },
  col30: { width: '30%' },
  col40: { width: '40%' },
  col45: { width: '45%' },  // Add this new style
  col50: { width: '50%' },
  col80: { width: '80%' },
  col90: { width: '90%' },
  tableHeader: {
     fontWeight: 'bold',
  fontFamily: 'Times-Roman',
  fontSize: 8,
  },

  tableRow: {
    flexDirection: 'row',
  },
  tableContainer: {
   borderWidth: 1,
  borderColor: '#000',
  marginTop: 12,
  marginBottom: 12,
},
signatureSection: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 24,
  // breakInside: 'avoid', // Prevents breaking signatures across pages
  // breakBefore: 'auto', // Allows page break before signatures if needed
  // breakAfter: 'avoid', // Prevents page break after signatures
  paddingTop: 10,
  paddingBottom: 10,
},
  signatureBox: {
    width: 180,
    height: 60,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  signatureLabel: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 2,
    fontFamily: 'Times-Roman',
  },
  signatureName: {
    fontWeight: 'bold',
    fontSize: 9,
    marginBottom: 4,
    fontFamily: 'Times-Roman',
  },
  signatureImage: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  signaturePlaceholder: {
    color: '#888',
    fontSize: 9,
    fontFamily: 'Times-Roman',
  },
    footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 15,
    fontSize: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 5,
    // borderTop: '1pt solid black', // Add a line above footer
    backgroundColor: 'white', // Ensure footer has background
    height: 20, // Set fixed height for footer
  },
  footerLeft: {
    textAlign: 'left',
    flex: 1,
    fontFamily: 'Times-Roman',
  },
  footerRight: {
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Times-Roman',
  },
  infoTableContainer: {
  borderWidth: 1,
  borderColor: '#000',
  marginTop: 12,
  marginBottom: 12,
},
infoTableRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderColor: '#000',
},
infoTableRowNoBorder: {
  flexDirection: 'row',
},
infoTableLabel: {
  fontWeight: 'bold',
  backgroundColor: '#f0f0f0',
  borderRightWidth: 1,
  borderColor: '#000',
  padding: 4,
  fontFamily: 'Times-Roman',
  fontSize: 8,
},
});

const ReportPDF: React.FC<ReportPDFProps> = ({ reportData, selectedEquipment, username, barcodeBase64 }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={{ height: 30 }}></View>
      {/* Image Header */}
      <Image src={ReportHeader} style={styles.headerImage} />
     <View style={styles.content}>
      {/* Title and Barcode Row */}
    <View style={styles.titleBarcodeRow}>
      <View style={{ flex: 1 }} /> {/* Left spacer */}
      <Text style={styles.title}>Checklist Report</Text>
      {barcodeBase64 && (
      <Image src={barcodeBase64} style={styles.barcode} />
      )}
    </View>

      {/* Info Table */}
   {/* Info Table */}
<View style={styles.infoTableContainer}>
  {/* Tenant Row */}
  <View style={styles.infoTableRow}>
    <Text style={[styles.infoTableLabel, styles.col10]}>Tenant</Text>
    <Text style={[styles.cell, styles.col90]}>{reportData.tenant}</Text>
  </View>
  {/* Building Row */}
  <View style={styles.infoTableRow}>
    <Text style={[styles.infoTableLabel, styles.col10]}>Building</Text>
    <Text style={[styles.cell, styles.col90]}>{reportData.building}</Text>
  </View>
  {/* Date & Visit Type Row */}
  <View style={styles.infoTableRow}>
    <Text style={[styles.infoTableLabel, styles.col10]}>Date</Text>
    <Text style={[styles.cell, styles.col40]}>
      {formatDateTimeLong(reportData.submissionDate)}
    </Text>
    <Text style={[styles.infoTableLabel, styles.col10]}>Visit Type</Text>
    <Text style={[styles.cell, styles.col40]}>{reportData.visitType}</Text>
  </View>
  {/* Contract No & Unit Row */}
  <View style={styles.infoTableRow}>
    <Text style={[styles.infoTableLabel, styles.col10]}>Contract No</Text>
    <Text style={[styles.cell, styles.col40]}>{reportData.contractNo}</Text>
    <Text style={[styles.infoTableLabel, styles.col10]}>Unit</Text>
    <Text style={[styles.cell, styles.col40]}>{reportData.unit}</Text>
  </View>
  {/* Start & End Row */}
  <View style={styles.infoTableRowNoBorder}>
    <Text style={[styles.infoTableLabel, styles.col10]}>Start</Text>
    <Text style={[styles.cell, styles.col40]}>
      {reportData.startDate ? formatDateShort(reportData.startDate) : '-'}
    </Text>
    <Text style={[styles.infoTableLabel, styles.col10]}>End</Text>
    <Text style={[styles.cell, styles.col40]}>
      {reportData.endDate ? formatDateShort(reportData.endDate) : '-'}
    </Text>
  </View>
</View>
      {/* <View style={styles.row}>
        <Text style={[styles.cell, styles.label, styles.col20]}>Visit Type</Text>
        <Text style={[styles.cell, styles.col80]}>{reportData.visitType}</Text>
      </View> */}

      {/* Equipment Status Label */}
      <Text style={styles.sectionLabel}>Equipment Status:</Text>

      {/* Equipment Table */}
      <View style={styles.row}>
        <Text style={[styles.cell, styles.tableHeader, styles.col5]}>SI No</Text>
        <Text style={[styles.cell, styles.tableHeader, styles.col45]}>Item Name</Text>
        <Text style={[styles.cell, styles.tableHeader, styles.col5]}>Unit</Text>
        <Text style={[styles.cell, styles.tableHeader, styles.col5]}>QTY</Text>
        <Text style={[styles.cell, styles.tableHeader, styles.col10]}>Status</Text>
        <Text style={[styles.cell, styles.tableHeader, styles.col30]}>Remarks</Text>
      </View>
     {/* Equipment Table */}
<View style={styles.tableContainer}>
  {/* Header */}
  <View style={[styles.row, { borderTopWidth: 0 }]}>
    <Text style={[styles.cell, styles.tableHeader, styles.col5]}>SI No</Text>
    <Text style={[styles.cell, styles.tableHeader, styles.col45]}>Item Name</Text>
    <Text style={[styles.cell, styles.tableHeader, styles.col5]}>Unit</Text>
    <Text style={[styles.cell, styles.tableHeader, styles.col5]}>QTY</Text>
    <Text style={[styles.cell, styles.tableHeader, styles.col10]}>Status</Text>
    <Text style={[styles.cell, styles.tableHeader, styles.col30]}>Remarks</Text>
  </View>
  {/* Rows */}
  {selectedEquipment.length === 0 ? (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.col5]}>-</Text>
      <Text style={[styles.cell, styles.col45, styles.boldBlack]}>Condition All Good</Text>
      <Text style={[styles.cell, styles.col5]}>-</Text>
      <Text style={[styles.cell, styles.col5]}>-</Text>
      <Text style={[styles.cell, styles.col10]}>-</Text>
      <Text style={[styles.cell, styles.col30]}>-</Text>
    </View>
  ) : (
    selectedEquipment.map((item, idx) => (
      <View style={styles.row} key={item.id}>
        <Text style={[styles.cell, styles.col5]}>{idx + 1}</Text>
        <Text style={[styles.cell, styles.col45]}>{item.itemname}</Text>
        <Text style={[styles.cell, styles.col5]}>{item.unit}</Text>
        <Text style={[styles.cell, styles.col5]}>{item.qty}</Text>
        <Text style={[styles.cell, styles.col10]}>{item.status}</Text>
        <Text style={[styles.cell, styles.col30]}>{item.remarks}</Text>
      </View>
    ))
  )}
</View>
      {/* Signatures */}
      <View style={styles.signatureSection}>
        {/* Tenant Signature */}
        <View>
          <Text style={styles.signatureLabel}>ACCEPTED BY:</Text>
          <Text style={styles.signatureName}>{reportData.tenant}</Text>
          <View style={styles.signatureBox}>
            {reportData.tenantSignature ? (
              <Image
                src={reportData.tenantSignature}
                style={styles.signatureImage}
              />
            ) : (
              <Text style={styles.signaturePlaceholder}>No signature provided</Text>
            )}
          </View>
        </View>
        {/* Technician Signature */}
        <View>
          <Text style={styles.signatureLabel}>PREPARED BY:</Text>
          <Text style={styles.signatureName}>{username || 'Technician'}</Text>
          <View style={styles.signatureBox}>
            {reportData.technicianSignature ? (
              <Image
                src={reportData.technicianSignature}
                style={styles.signatureImage}
              />
            ) : (
              <Text style={styles.signaturePlaceholder}>No signature provided</Text>
            )}
          </View>
        </View>
      </View>
  </View>
      <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>
        Printed By: {formatDateTimeLong(new Date())}
      </Text>
      <Text
        style={styles.footerRight}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
    </Page>
  </Document>
);

export default ReportPDF;