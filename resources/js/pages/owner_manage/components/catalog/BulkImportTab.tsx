import React, { useState, useRef, useEffect } from 'react';
import { FiDownload, FiUploadCloud, FiCheckCircle, FiAlertCircle, FiSettings, FiLayers, FiFileText, FiChevronRight } from 'react-icons/fi';
import { toast } from '@/pages/owner_manage/utils/toast';
import '@/pages/owner_manage/style/font.css';

export const BulkImportTab: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importSummary, setImportSummary] = useState({
    success: 0,
    failed: 0,
    warnings: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      setProgress(0);
      setFile(null);
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
      } else {
        toast.error('Only CSV and XLSX files are supported.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // Generate dummy CSV template download
    const headers = ['Product Name', 'Description', 'Price', 'Stock Quantity', 'Category Name', 'Brand Name', 'SKU'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" +
      "Example Pizza,Delicious Pepperoni & Cheese,12.99,100,Pizzas,Brand A,PIZ-101\n" +
      "Classic Burger,Beef patty with cheddar,8.50,50,Burgers,Brand B,BRG-202";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully!');
  };

  const handleNextToMapping = () => {
    if (!file) {
      toast.error('Please upload a products file first.');
      return;
    }
    setStep(2);
  };

  const handleStartImport = () => {
    setStep(3);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setImportSummary({
              success: 42,
              failed: 3,
              warnings: 5,
            });
            setStep(4);
            window.dispatchEvent(new CustomEvent('data_updated'));
            new BroadcastChannel('data_updates').postMessage('refresh');
            toast.success('Bulk import completed!');
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleReset = () => {
    setFile(null);
    setStep(1);
    setProgress(0);
  };

  return (
    <div className="space-y-6 font-kuntomruy animate-fade-in text-slate-700 w-full text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800">Bulk Import Products</h2>
        <p className="text-slate-400 text-xs font-semibold mt-1">
          Import thousands of menu items or products to your store catalog using a CSV or Excel template.
        </p>
      </div>

      {/* Step Indicator Header */}
      <div className="bg-white border border-slate-100 rounded-[16px] p-6 shadow-xs flex items-center justify-between">
        {[
          { num: 1, label: 'Upload File' },
          { num: 2, label: 'Map Columns' },
          { num: 3, label: 'Importing' },
          { num: 4, label: 'Finished' },
        ].map((item, idx, arr) => (
          <React.Fragment key={item.num}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === item.num
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                  : step > item.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {step > item.num ? '✓' : item.num}
              </span>
              <span className={`text-xs font-extrabold ${step === item.num ? 'text-indigo-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <FiChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Steps Content */}
      <div className="bg-white border border-slate-100 rounded-[16px] p-8 shadow-xs">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Panel: Download template instruction */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800">1. Download Template File</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Before uploading, make sure you align your data with our catalog template file. This ensures all pricing, attributes, categories, and stock requirements are parsed without error.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer"
                >
                  <FiDownload className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Right Panel: File Upload Box */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800">2. Select Product Database File</h3>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-[12px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-indigo-600 bg-indigo-50/20'
                      : file
                      ? 'border-emerald-500 bg-emerald-50/10'
                      : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />
                  <FiUploadCloud className={`w-10 h-10 mb-3 ${file ? 'text-emerald-500' : 'text-indigo-600'}`} />
                  {file ? (
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        {(file.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">Drag and drop file here</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        or click to browse from files (CSV or XLSX up to 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleNextToMapping}
                disabled={!file}
                className={`font-bold px-6 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer ${
                  file
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Proceed to Columns Mapping
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Map File Columns to Database Fields</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Match headers detected from your sheet with the corresponding database product fields.
              </p>
            </div>

            {/* Matching table */}
            <div className="border border-slate-100 rounded-[12px] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Database Field</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Matches With Column</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Required</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Data Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                  {[
                    { dbField: 'Product Name', required: true, match: 'Product Name', preview: 'Example Pizza' },
                    { dbField: 'Retail Price', required: true, match: 'Price', preview: '12.99' },
                    { dbField: 'Description', required: false, match: 'Description', preview: 'Delicious Pepperoni...' },
                    { dbField: 'Stock Qty', required: true, match: 'Stock Quantity', preview: '100' },
                    { dbField: 'Category', required: false, match: 'Category Name', preview: 'Pizzas' },
                  ].map((field, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-extrabold text-slate-700">{field.dbField}</td>
                      <td className="px-6 py-4">
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                          <option>{field.match}</option>
                          <option>Select another column</option>
                          <option>Skip field</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {field.required ? (
                          <span className="text-rose-500">Yes</span>
                        ) : (
                          <span className="text-slate-400">Optional</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{field.preview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleStartImport}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Start Import Process
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
            <FiSettings className="w-12 h-12 text-indigo-600 animate-spin" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Processing Import...</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1 max-w-sm">
                Parsing records, validating pricing limits, and creating database rows. Do not close this tab.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-xs font-black text-slate-700">{progress}% Completed</span>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <FiCheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800">Catalog Import Completed!</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Your products have been processed. Here is the import execution report.
              </p>
            </div>

            {/* Metrics Report Grid */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="block text-2xl font-black text-emerald-600">{importSummary.success}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Successfully Imported</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="block text-2xl font-black text-rose-600">{importSummary.failed}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Failed Rows</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <span className="block text-2xl font-black text-amber-600">{importSummary.warnings}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 block">Warnings</span>
              </div>
            </div>

            {/* Error logs if any */}
            {importSummary.failed > 0 && (
              <div className="bg-rose-50 border border-rose-100 text-left rounded-xl p-4 max-w-md mx-auto flex items-start gap-3">
                <FiAlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800">Validation Failures:</h4>
                  <ul className="list-disc pl-4 text-[10px] font-bold text-rose-600 space-y-1 mt-1.5">
                    <li>Row 14: "Stock Quantity" must be a positive integer.</li>
                    <li>Row 29: "Price" missing required format.</li>
                    <li>Row 32: Category "Snacks" not found in Organization.</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-center gap-3 pt-6 border-t border-slate-100 max-w-md mx-auto">
              <button
                onClick={handleReset}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer"
              >
                Import New File
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('active_tab_change', { detail: 'menu-items' }));
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-[10px] text-xs transition-all border-none cursor-pointer shadow-md shadow-indigo-600/20"
              >
                View Product Catalog
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
