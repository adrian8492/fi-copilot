import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintReportButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            /* Hide navigation and sidebar */
            nav, aside, .no-print {
              display: none !important;
            }
            
            /* Set background to white */
            * {
              background: white !important;
              color: black !important;
              box-shadow: none !important;
            }
            
            /* Format tables */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            table th,
            table td {
              border: 1px solid #000 !important;
              padding: 8px !important;
              text-align: left !important;
            }
            
            table th {
              background-color: #f5f5f5 !important;
              font-weight: bold !important;
            }
            
            /* Page layout */
            body {
              margin: 0 !important;
              padding: 20px !important;
              font-family: Arial, sans-serif !important;
              font-size: 12px !important;
              line-height: 1.4 !important;
            }
            
            /* Headers */
            h1, h2, h3, h4, h5, h6 {
              color: black !important;
              margin-bottom: 10px !important;
            }
            
            /* Cards and containers */
            .card, .bg-card {
              border: 1px solid #ccc !important;
              margin-bottom: 20px !important;
              padding: 15px !important;
            }
            
            /* Charts and graphics */
            svg {
              max-width: 100% !important;
              height: auto !important;
            }
            
            /* Page breaks */
            .page-break {
              page-break-before: always !important;
            }
            
            /* Hide buttons and interactive elements */
            button:not(.print-button) {
              display: none !important;
            }
          }
        `}
      </style>
      
      <Button onClick={handlePrint} variant="outline" size="sm" className="print-button">
        <Printer className="h-4 w-4 mr-2" />
        Print Report
      </Button>
    </>
  );
}

export default PrintReportButton;
