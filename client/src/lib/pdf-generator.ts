import jsPDF from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  subscriptionId: number;
  subscriptionDate: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;
  vendorCity: string;
  vendorState: string;
  vendorPincode: string;
  planName: string;
  planDescription: string;
  planDuration: number;
  planDurationType: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  features: string[];
  autoRenew: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = 0;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margin;
    
    // Set default font
    this.doc.setFont('helvetica');
  }

  private addText(text: string, x: number, y: number, options: any = {}) {
    this.doc.setFontSize(options.fontSize || 12);
    
    // Handle color properly
    if (options.color) {
      if (typeof options.color === 'string' && options.color.startsWith('#')) {
        // Convert hex to RGB
        const hex = options.color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        this.doc.setTextColor(r, g, b);
      } else if (Array.isArray(options.color) && options.color.length === 3) {
        this.doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      } else {
        this.doc.setTextColor(0, 0, 0);
      }
    } else {
      this.doc.setTextColor(0, 0, 0);
    }
    
    if (options.align) {
      this.doc.text(text, x, y, { align: options.align });
    } else {
      this.doc.text(text, x, y);
    }
  }

  private addLine(x1: number, y1: number, x2: number, y2: number, color: string = '#000000') {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      this.doc.setDrawColor(r, g, b);
    } else {
      this.doc.setDrawColor(0, 0, 0);
    }
    this.doc.line(x1, y1, x2, y2);
  }

  private addRect(x: number, y: number, width: number, height: number, color: string = '#000000') {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      this.doc.setDrawColor(r, g, b);
    } else {
      this.doc.setDrawColor(0, 0, 0);
    }
    this.doc.rect(x, y, width, height);
  }

  private checkPageBreak(requiredSpace: number): boolean {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatCurrency(amount: number, currency: string = 'INR'): string {
    // Ensure amount is a number
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (currency === 'INR') {
      // Use simple formatting to avoid PDF rendering issues
      return `Rs. ${numAmount.toFixed(2)}`;
    } else {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(numAmount);
    }
  }

  generateSubscriptionInvoice(invoiceData: InvoiceData): void {
    // Header
    this.addHeader(invoiceData);
    
    // Invoice Details
    this.addInvoiceDetails(invoiceData);
    
    // Vendor Details
    this.addVendorDetails(invoiceData);
    
    // Subscription Details
    this.addSubscriptionDetails(invoiceData);
    
    // Plan Features
    if (invoiceData.features && invoiceData.features.length > 0) {
      this.addPlanFeatures(invoiceData.features);
    }
    
    // Payment Information
    this.addPaymentInformation(invoiceData);
    
    // Total Amount
    this.addTotalAmount(invoiceData);
    
    // Footer
    this.addFooter();
  }

  private addHeader(invoiceData: InvoiceData): void {
    // Company Header
    this.doc.setFillColor(37, 99, 235); // Blue background
    this.doc.rect(0, 0, this.pageWidth, 50, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.text('LOCALSOCH', this.pageWidth / 2, 25, { align: 'center' });
    this.doc.setFontSize(14);
    this.doc.text('Subscription Invoice', this.pageWidth / 2, 35, { align: 'center' });
    
    // Invoice Number Box - compact and well positioned
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.pageWidth - 70, 8, 60, 16, 'F');
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(7);
    this.doc.text('Invoice #', this.pageWidth - 65, 16);
    this.doc.setFontSize(8);
    this.doc.text(invoiceData.invoiceNumber, this.pageWidth - 65, 21);
    
    this.currentY = 70;
  }

  private addInvoiceDetails(invoiceData: InvoiceData): void {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Invoice Details', this.margin, this.currentY);
    this.currentY += 10;
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    const details = [
      ['Invoice Date:', this.formatDate(invoiceData.invoiceDate)],
      ['Subscription ID:', `#${invoiceData.subscriptionId}`],
      ['Subscription Date:', this.formatDate(invoiceData.subscriptionDate)],
      ['Status:', invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)]
    ];
    
    this.doc.setFontSize(10);
    details.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      this.doc.text(value, this.margin + 60, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 10;
  }

  private addVendorDetails(invoiceData: InvoiceData): void {
    this.checkPageBreak(60);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Vendor Details', this.margin, this.currentY);
    this.currentY += 10;
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(14);
    this.doc.text(invoiceData.vendorName, this.margin, this.currentY);
    this.currentY += 8;
    
    this.doc.setFontSize(10);
    if (invoiceData.vendorEmail) {
      this.doc.text(`Email: ${invoiceData.vendorEmail}`, this.margin, this.currentY);
      this.currentY += 6;
    }
    
    if (invoiceData.vendorPhone) {
      this.doc.text(`Phone: ${invoiceData.vendorPhone}`, this.margin, this.currentY);
      this.currentY += 6;
    }
    
    if (invoiceData.vendorAddress) {
      this.doc.text(`Address: ${invoiceData.vendorAddress}`, this.margin, this.currentY);
      this.currentY += 6;
      
      if (invoiceData.vendorCity) {
        this.doc.text(`${invoiceData.vendorCity}, ${invoiceData.vendorState} ${invoiceData.vendorPincode}`, 
          this.margin + 20, this.currentY);
        this.currentY += 6;
      }
    }
    
    this.currentY += 10;
  }

  private addSubscriptionDetails(invoiceData: InvoiceData): void {
    this.checkPageBreak(80);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Subscription Details', this.margin, this.currentY);
    this.currentY += 10;
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    const details = [
      ['Plan Name:', invoiceData.planName],
      ['Description:', invoiceData.planDescription || 'N/A'],
      ['Duration:', `${invoiceData.planDuration} ${invoiceData.planDurationType}`],
      ['Start Date:', this.formatDate(invoiceData.startDate)],
      ['End Date:', this.formatDate(invoiceData.endDate)],
      ['Auto Renew:', invoiceData.autoRenew ? 'Yes' : 'No']
    ];
    
    this.doc.setFontSize(10);
    details.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      
      // Handle long text wrapping
      const maxWidth = this.pageWidth - this.margin - 80;
      const lines = this.doc.splitTextToSize(value, maxWidth);
      
      if (Array.isArray(lines)) {
        lines.forEach((line: string, index: number) => {
          this.doc.text(line, this.margin + 60, this.currentY + (index * 6));
        });
        this.currentY += (lines.length * 6) + 2;
      } else {
        this.doc.text(value, this.margin + 60, this.currentY);
        this.currentY += 8;
      }
    });
    
    this.currentY += 10;
  }

  private addPlanFeatures(features: string[]): void {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Plan Features', this.margin, this.currentY);
    this.currentY += 10;
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(10);
    features.forEach((feature, index) => {
      this.doc.text(`• ${feature}`, this.margin + 10, this.currentY);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private addPaymentInformation(invoiceData: InvoiceData): void {
    this.checkPageBreak(60);
    
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Payment Information', this.margin, this.currentY);
    this.currentY += 10;
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    const paymentDetails = [
      ['Payment Method:', invoiceData.paymentMethod.charAt(0).toUpperCase() + invoiceData.paymentMethod.slice(1)],
      ['Payment ID:', invoiceData.paymentId],
    ];
    
    if (invoiceData.orderId) {
      paymentDetails.push(['Order ID:', invoiceData.orderId]);
    }
    
    this.doc.setFontSize(10);
    paymentDetails.forEach(([label, value]) => {
      this.doc.text(label, this.margin, this.currentY);
      this.doc.text(value, this.margin + 60, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 10;
  }

  private addTotalAmount(invoiceData: InvoiceData): void {
    this.checkPageBreak(30);
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Total Amount', this.margin, this.currentY);
    
    this.doc.setFontSize(18);
    this.doc.setTextColor(5, 150, 105); // Green color
    const totalText = this.formatCurrency(invoiceData.amount, invoiceData.currency);
    const textWidth = this.doc.getTextWidth(totalText);
    this.doc.text(totalText, this.pageWidth - this.margin - textWidth, this.currentY);
    
    this.currentY += 15;
  }

  private addFooter(): void {
    this.checkPageBreak(30);
    
    this.addLine(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
    
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Thank you for subscribing to LocalSoch!', 
      this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    this.doc.setFontSize(10);
    this.doc.text('For support, contact: support@localsoch.com', 
      this.pageWidth / 2, this.currentY, { align: 'center' });
  }

  download(filename: string = 'subscription-invoice.pdf'): void {
    this.doc.save(filename);
  }

  getDataURL(): string {
    return this.doc.output('dataurlstring');
  }
}

export function generateSubscriptionInvoicePDF(invoiceData: InvoiceData, filename?: string): void {
  const generator = new PDFGenerator();
  generator.generateSubscriptionInvoice(invoiceData);
  generator.download(filename || `subscription-invoice-${invoiceData.subscriptionId}.pdf`);
}
