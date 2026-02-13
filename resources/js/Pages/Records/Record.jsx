import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect, useMemo } from 'react';

export default function Record({ auth, records = [], offices = [] }) {
    const { errors, success } = usePage().props.flash || {};
    
    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterOffice, setFilterOffice] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // UI States
    const [showFilters, setShowFilters] = useState(() => {
        // Get initial state from localStorage, default to true if not set
        const saved = localStorage.getItem('recordsFiltersVisible');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isPrintPreview, setIsPrintPreview] = useState(false);
    const [printOrientation, setPrintOrientation] = useState('portrait');
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    
    const printRef = useRef();

    // Save filter visibility to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('recordsFiltersVisible', JSON.stringify(showFilters));
    }, [showFilters]);

    // Show notification when flash messages are received
    useEffect(() => {
        if (success) {
            setNotificationMessage(success);
            setNotificationType('success');
            setShowNotification(true);
            
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
        
        if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            setNotificationMessage(Array.isArray(firstError) ? firstError[0] : firstError);
            setNotificationType('error');
            setShowNotification(true);
            
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 7000);
            
            return () => clearTimeout(timer);
        }
    }, [success, errors]);

    // Memoized filtered records for performance
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            const matchesSearch = 
                (record.from?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (record.proponent?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (record.particulars?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (record.place?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
            const matchesType = filterType === 'all' || record.type === filterType;
            const matchesOffice = filterOffice === 'all' || record.offices_id === parseInt(filterOffice);
            
            let matchesDate = true;
            if (dateFrom || dateTo) {
                const recordDate = new Date(record.created_at);
                if (dateFrom) {
                    const fromDate = new Date(dateFrom);
                    fromDate.setHours(0, 0, 0, 0);
                    matchesDate = matchesDate && recordDate >= fromDate;
                }
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    matchesDate = matchesDate && recordDate <= toDate;
                }
            }
            
            return matchesSearch && matchesStatus && matchesType && matchesOffice && matchesDate;
        });
    }, [records, searchTerm, filterStatus, filterType, filterOffice, dateFrom, dateTo]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterType, filterOffice, dateFrom, dateTo, itemsPerPage]);

    const getStatusColor = (status) => {
        const colors = {
            'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
            'for-filing': 'bg-amber-50 text-amber-700 border-amber-200',
            'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getTypeColor = (type) => {
        const colors = {
            'request': 'bg-purple-50 text-purple-700 border-purple-200',
            'letter': 'bg-indigo-50 text-indigo-700 border-indigo-200',
            'other': 'bg-slate-50 text-slate-700 border-slate-200',
        };
        return colors[type] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const handlePrintPreview = (orientation = 'portrait') => {
        setPrintOrientation(orientation);
        setIsPrintPreview(true);
        
        setNotificationMessage(`Print preview ready with ${filteredRecords.length} records`);
        setNotificationType('success');
        setShowNotification(true);
        
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups for printing');
            return;
        }

        // Get print styles
        const printStyles = `
            <style>
                @page {
                    size: ${printOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
                    margin: 20mm 15mm;
                }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    margin: 0;
                    padding: 0;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                }
                .print-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .print-subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background-color: #f3f4f6;
                    font-weight: bold;
                    text-align: left;
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                    vertical-align: top;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .print-footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 10px;
                    color: #777;
                    border-top: 1px solid #ddd;
                    padding-top: 10px;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        `;

        // Create print content HTML
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Records Master List</title>
                ${printStyles}
            </head>
            <body>
                <div class="print-header">
                    <div class="print-title">RECORDS MASTER LIST</div>
                    <div class="print-subtitle">Generated on ${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                    <div class="print-subtitle">Total Records: ${filteredRecords.length}</div>
                    ${hasActiveFilters ? `<div class="print-subtitle">Filtered Results (${activeFilterCount} active filter(s))</div>` : ''}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Proponent</th>
                            <th>Particulars</th>
                            <th>Office</th>
                            <th>In Charge</th>
                            <th>Status</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredRecords.map((record, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${formatDateShort(record.created_at)}</td>
                                <td>${record.type || 'other'}</td>
                                <td>${record.proponent || '-'}</td>
                                <td>${record.particulars || '-'}</td>
                                <td>${record.office?.name || '-'}</td>
                                <td>${record.incharge?.full_name || '-'}</td>
                                <td>${record.status}</td>
                              
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="print-footer">
                    Records Management System • Generated ${new Date().toLocaleString('en-US')} • Page 1 of 1
                </div>
                
                <script>
                    // Auto-print when loaded
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `;

        // Write and print
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        setNotificationMessage('Print dialog opened');
        setNotificationType('success');
        setShowNotification(true);
        
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    const closePrintPreview = () => {
        setIsPrintPreview(false);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('all');
        setFilterType('all');
        setFilterOffice('all');
        setDateFrom('');
        setDateTo('');
        
        setNotificationMessage('All filters cleared');
        setNotificationType('success');
        setShowNotification(true);
        
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    const closeNotification = () => {
        setShowNotification(false);
    };

    const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterOffice !== 'all' || dateFrom || dateTo;
    const activeFilterCount = [searchTerm, filterStatus !== 'all', filterType !== 'all', filterOffice !== 'all', dateFrom, dateTo].filter(Boolean).length;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(dateString));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h2 className="font-bold text-2xl text-gray-900">
                            Records Master List
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold text-gray-900">{filteredRecords.length}</span> of <span className="font-semibold text-gray-900">{records.length}</span> records
                            </p>
                            {hasActiveFilters && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {activeFilterCount} {activeFilterCount === 1 ? 'Filter' : 'Filters'} Active
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 border border-gray-300 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                        <button
                            onClick={() => handlePrintPreview('portrait')}
                            disabled={filteredRecords.length === 0}
                            className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 border border-gray-900 transition-all text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Preview
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Records" />

            {/* Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
                    <div className={`${
                        notificationType === 'success' 
                            ? 'bg-white border-l-4 border-green-500' 
                            : 'bg-white border-l-4 border-red-500'
                    } rounded-lg shadow-lg max-w-md`}>
                        <div className="px-4 py-3 flex items-start gap-3">
                            <div className={`flex-shrink-0 ${
                                notificationType === 'success' ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {notificationType === 'success' ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notificationMessage}</p>
                            </div>
                            <button 
                                onClick={closeNotification}
                                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                    
                    {/* Filters Section */}
                    {showFilters && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        <h3 className="text-base font-semibold text-gray-900">Filters</h3>
                                    </div>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by from, proponent, particulars, or place..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Filter Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Type Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="request">Request</option>
                                            <option value="letter">Letter</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="for-filing">For Filing</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Office Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Office</label>
                                        <select
                                            value={filterOffice}
                                            onChange={(e) => setFilterOffice(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                        >
                                            <option value="all">All Offices</option>
                                            {offices.map((office) => (
                                                <option key={office.id} value={office.id}>
                                                    {office.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Range */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-xs"
                                                placeholder="From"
                                            />
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-xs"
                                                placeholder="To"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Records Table */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                        {filteredRecords.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 mb-1">No records found</h3>
                                <p className="text-gray-500 text-sm mb-4">
                                    {hasActiveFilters ? 'Try adjusting your filters' : 'No records available'}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No.</th>
                                                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                               
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Proponent</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Particulars</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Office</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">In Charge</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                               
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {paginatedRecords.map((record, index) => (
                                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {startIndex + index + 1}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {formatDateShort(record.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs font-medium rounded border ${getTypeColor(record.type)}`}>
                                                            {record.type || 'other'}
                                                        </span>
                                                    </td>
                                                  
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {record.proponent || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                                        <div className="line-clamp-2" title={record.particulars}>
                                                            {record.particulars || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {record.office?.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                        {record.incharge?.full_name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full border ${getStatusColor(record.status)}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <span>
                                                    Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length} results
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <select
                                                    value={itemsPerPage}
                                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                                >
                                                    <option value={10}>10 per page</option>
                                                    <option value={25}>25 per page</option>
                                                    <option value={50}>50 per page</option>
                                                    <option value={100}>100 per page</option>
                                                </select>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                
                                                <div className="hidden sm:flex items-center gap-1">
                                                    {getPageNumbers().map((page, index) => (
                                                        page === '...' ? (
                                                            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                                                                ...
                                                            </span>
                                                        ) : (
                                                            <button
                                                                key={page}
                                                                onClick={() => handlePageChange(page)}
                                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                                                                    currentPage === page
                                                                        ? 'bg-gray-900 text-white'
                                                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {page}
                                                            </button>
                                                        )
                                                    ))}
                                                </div>
                                                
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Preview Modal */}
            {isPrintPreview && filteredRecords.length > 0 && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Print Preview</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {filteredRecords.length} records • {printOrientation === 'landscape' ? 'Landscape' : 'Portrait'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                                    <button
                                        onClick={() => setPrintOrientation('portrait')}
                                        className={`px-3 py-1 text-sm font-medium rounded transition ${
                                            printOrientation === 'portrait' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                                        }`}
                                    >
                                        Portrait
                                    </button>
                                    <button
                                        onClick={() => setPrintOrientation('landscape')}
                                        className={`px-3 py-1 text-sm font-medium rounded transition ${
                                            printOrientation === 'landscape' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                                        }`}
                                    >
                                        Landscape
                                    </button>
                                </div>
                                <button
                                    onClick={handlePrint}
                                    className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print
                                </button>
                                <button 
                                    onClick={closePrintPreview} 
                                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-6 bg-gray-50" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                            <div className="bg-white p-8 shadow-sm">
                                <div className="text-center mb-6 border-b pb-4">
                                    <h1 className="text-2xl font-bold">RECORDS MASTER LIST</h1>
                                    <p className="text-gray-600 mt-2">
                                        Generated on {new Date().toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="text-gray-600">
                                        Total Records: {filteredRecords.length}
                                    </p>
                                    {hasActiveFilters && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            Filtered results - {activeFilterCount} active filter(s)
                                        </p>
                                    )}
                                </div>
                                
                                <table className="min-w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">No.</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Date</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Type</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Proponent</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Particulars</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Office</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">In Charge</th>
                                            <th className="border border-gray-300 px-3 py-2 text-left text-xs font-semibold">Status</th>
                                            
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.map((record, index) => (
                                            <tr key={record.id} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{formatDateShort(record.created_at)}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.type || 'other'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.proponent || '-'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.particulars || '-'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.office?.name || '-'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.incharge?.full_name || '-'}</td>
                                                <td className="border border-gray-300 px-3 py-2 text-sm">{record.status}</td>
                                               
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                <div className="mt-8 text-xs text-gray-500 text-center border-t pt-4">
                                    <p>Records Management System • Generated {new Date().toLocaleString('en-US')} • Page 1 of 1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}