import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function YearRecords({ 
    auth, 
    year,
    communications = [], 
    offices = [], 
    incharges = [],
    statistics = {}
}) {
    // ──────────────────────────────────────────────────────────────
    // State Management
    // ──────────────────────────────────────────────────────────────
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [officeFilter, setOfficeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('yearRecordsItemsPerPage');
        return saved ? parseInt(saved) : 15;
    });
    const [viewingRecord, setViewingRecord] = useState(null);
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('yearRecordsViewMode');
        return saved || 'list';
    });
    const [sortBy, setSortBy] = useState(() => {
        const saved = localStorage.getItem('yearRecordsSortBy');
        return saved || 'date-desc';
    });

    // ──────────────────────────────────────────────────────────────
    // Effects
    // ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem('yearRecordsViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('yearRecordsItemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    useEffect(() => {
        localStorage.setItem('yearRecordsSortBy', sortBy);
    }, [sortBy]);

    // ─────────────────────────────────────────────────────────────────
    // Filtering & Sorting
    // ─────────────────────────────────────────────────────────────────
    const filteredCommunications = useMemo(() => {
        let filtered = [...communications];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(comm => 
                comm.particulars?.toLowerCase().includes(q) ||
                comm.proponent?.toLowerCase().includes(q) ||
                comm.type?.toLowerCase().includes(q) ||
                comm.office?.name?.toLowerCase().includes(q) ||
                formatName(comm.incharge)?.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(comm => comm.status === statusFilter);
        }

        if (officeFilter !== 'all') {
            filtered = filtered.filter(comm => comm.offices_id === parseInt(officeFilter));
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(comm => comm.type === typeFilter);
        }

        if (dateStart || dateEnd) {
            filtered = filtered.filter(comm => {
                const commDateStr = new Date(comm.created_at).toISOString().split('T')[0];
                if (dateStart && dateEnd) {
                    return commDateStr >= dateStart && commDateStr <= dateEnd;
                } else if (dateStart) {
                    return commDateStr >= dateStart;
                } else if (dateEnd) {
                    return commDateStr <= dateEnd;
                }
                return true;
            });
        }

        // Sorting
        switch (sortBy) {
            case 'date-desc':
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'date-asc':
                filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'proponent-asc':
                filtered.sort((a, b) => (a.proponent || '').localeCompare(b.proponent || ''));
                break;
            case 'proponent-desc':
                filtered.sort((a, b) => (b.proponent || '').localeCompare(a.proponent || ''));
                break;
            case 'status-asc':
                filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
                break;
            case 'status-desc':
                filtered.sort((a, b) => (b.status || '').localeCompare(a.status || ''));
                break;
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return filtered;
    }, [communications, searchQuery, statusFilter, officeFilter, typeFilter, dateStart, dateEnd, sortBy]);

    // ─────────────────────────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage);
    const paginatedCommunications = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCommunications.slice(start, start + itemsPerPage);
    }, [filteredCommunications, currentPage, itemsPerPage]);

    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setCurrentPage(1);
    };

    // ─────────────────────────────────────────────────────────────────
    // Computed Values
    // ─────────────────────────────────────────────────────────────────
    const communicationTypes = useMemo(() => {
        const types = new Set(communications.map(c => c.type).filter(Boolean));
        return Array.from(types).sort();
    }, [communications]);

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || officeFilter !== 'all' || 
                            typeFilter !== 'all' || dateStart || dateEnd;

    const dateMin = `${year}-01-01`;
    const dateMax = `${year}-12-31`;

    // ─────────────────────────────────────────────────────────────────
    // Utility Functions
    // ─────────────────────────────────────────────────────────────────
    const formatName = (incharge) => {
        if (!incharge) return 'Unassigned';
        const parts = [incharge.firstname, incharge.middlename, incharge.lastname].filter(Boolean);
        const name = parts.join(' ');
        return incharge.suffix ? `${name}, ${incharge.suffix}` : name;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatFullDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true 
        });
    };

    const statusConfig = {
        'for-filing': { 
            label: 'For Filing', 
            bg: 'bg-amber-50', 
            text: 'text-amber-700', 
            dot: 'bg-amber-500', 
            border: 'border-amber-200' 
        },
        'in-progress': { 
            label: 'In Progress', 
            bg: 'bg-blue-50', 
            text: 'text-blue-700', 
            dot: 'bg-blue-500', 
            border: 'border-blue-200' 
        },
        'completed': { 
            label: 'Completed', 
            bg: 'bg-emerald-50', 
            text: 'text-emerald-700', 
            dot: 'bg-emerald-500', 
            border: 'border-emerald-200' 
        },
    };

    const getStatusBadge = (status) => statusConfig[status] || 
        { label: 'Unknown', bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', border: 'border-gray-200' };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setOfficeFilter('all');
        setTypeFilter('all');
        setDateStart('');
        setDateEnd('');
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Proponent', 'Type', 'Office', 'In-charge', 'Status', 'Particulars'];
        const rows = filteredCommunications.map(comm => [
            new Date(comm.created_at).toLocaleDateString(),
            comm.proponent || 'N/A',
            comm.type || 'N/A',
            comm.office?.name || 'N/A',
            formatName(comm.incharge),
            comm.status || 'N/A',
            `"${(comm.particulars || '').replace(/"/g, '""')}"`
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${year}-records-export.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // ─────────────────────────────────────────────────────────────────
    // Loading Skeletons
    // ─────────────────────────────────────────────────────────────────
    const SkeletonStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100/60 rounded-lg px-4 py-3 border border-gray-100/80 animate-pulse">
                    <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-12 bg-gray-300 rounded"></div>
                </div>
            ))}
        </div>
    );

    const SkeletonRows = () => (
        <div className="divide-y divide-gray-100">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="py-4 px-1">
                    <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-7 text-right">
                            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </div>
                        <div className="w-0.5 self-stretch bg-gray-100 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const SkeletonCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                    <div className="space-y-2">
                        <div className="h-3 w-32 bg-gray-200 rounded"></div>
                        <div className="h-3 w-28 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────
    // Grid View Card Component
    // ─────────────────────────────────────────────────────────────────
    const RecordCard = ({ comm, index }) => {
        const badge = getStatusBadge(comm.status);
        const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;

        return (
            <div
                className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => setViewingRecord(comm)}
            >
                <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                            {badge.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">#{rowNumber}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                        {comm.particulars || 'Untitled Record'}
                    </h3>

                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">{comm.proponent || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="truncate">{comm.office?.name || 'Unassigned'}</span>
                        </div>
                        {comm.type && (
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                </svg>
                                <span className="truncate capitalize">{comm.type}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">{formatName(comm.incharge)}</span>
                        <span className="text-xs text-gray-400">{formatDate(comm.created_at)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/file-records" 
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Back to File Records"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800">{year} File Records</h1>
                            <p className="text-sm text-gray-400">Archive & Records Management</p>
                        </div>
                    </div>
                    {!isLoading && filteredCommunications.length > 0 && (
                        <button
                            onClick={exportToCSV}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Export to CSV"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </button>
                    )}
                </div>
            }
        >
            <Head title={`${year} File Records`} />

            {/* Statistics */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    {isLoading ? (
                        <SkeletonStats />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { label: 'Total Records', value: statistics.total || 0, color: 'gray' },
                                { label: 'For Filing', value: statistics.for_filing || 0, color: 'amber' },
                                { label: 'In Progress', value: statistics.in_progress || 0, color: 'blue' },
                                { label: 'Completed', value: statistics.completed || 0, color: 'emerald' },
                                { label: 'Completion Rate', value: `${statistics.completion_rate || 0}%`, color: 'purple' },
                            ].map((stat, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bg-${stat.color}-50/60 rounded-lg px-4 py-3 border border-${stat.color}-100/80 hover:border-${stat.color}-200 transition-colors cursor-default`}
                                >
                                    <div className={`text-xs font-medium text-${stat.color}-700/80 uppercase tracking-wide`}>
                                        {stat.label}
                                    </div>
                                    <div className={`text-xl font-semibold text-${stat.color}-800 mt-1`}>
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex-1 relative min-w-[200px]">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search particulars, proponent, type, office…"
                                value={searchQuery}
                                onChange={(e) => handleFilterChange(setSearchQuery)(e.target.value)}
                                className="block w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50/50 border border-gray-200 rounded-md placeholder-gray-400 focus:outline-none focus:border-blue-300 focus:ring-0 transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300 focus:ring-0 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <option value="all">All status</option>
                            <option value="for-filing">For Filing</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>

                        <select
                            value={officeFilter}
                            onChange={(e) => handleFilterChange(setOfficeFilter)(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300 focus:ring-0 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <option value="all">All offices</option>
                            {offices.map(office => (
                                <option key={office.id} value={office.id}>{office.name}</option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) => handleFilterChange(setTypeFilter)(e.target.value)}
                            className="px-3 py-1.5 text-sm bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300 focus:ring-0 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <option value="all">All types</option>
                            {communicationTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-200 rounded-md px-2 py-1">
                            <span className="text-xs text-gray-400">From</span>
                            <input
                                type="date"
                                value={dateStart}
                                onChange={(e) => handleFilterChange(setDateStart)(e.target.value)}
                                min={dateMin}
                                max={dateMax}
                                className="w-32 bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 disabled:opacity-50"
                                disabled={isLoading}
                            />
                            <span className="text-xs text-gray-400 mx-1">–</span>
                            <span className="text-xs text-gray-400">To</span>
                            <input
                                type="date"
                                value={dateEnd}
                                onChange={(e) => handleFilterChange(setDateEnd)(e.target.value)}
                                min={dateMin}
                                max={dateMax}
                                className="w-32 bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>

                        {hasActiveFilters && !isLoading && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-50/50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Records List/Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {!isLoading && (
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="text-xs text-gray-400 font-mono">
                                {paginatedCommunications.length} / {filteredCommunications.length} records
                            </div>
                            {filteredCommunications.length > 0 && (
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={15}>15 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {filteredCommunications.length > 0 && (
                                <>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-blue-300"
                                    >
                                        <option value="date-desc">Newest first</option>
                                        <option value="date-asc">Oldest first</option>
                                        <option value="proponent-asc">Proponent A-Z</option>
                                        <option value="proponent-desc">Proponent Z-A</option>
                                        <option value="status-asc">Status A-Z</option>
                                        <option value="status-desc">Status Z-A</option>
                                    </select>
                                    <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-2 py-1 text-xs transition-colors ${
                                                viewMode === 'list'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="List view"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-2 py-1 text-xs transition-colors ${
                                                viewMode === 'grid'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="Grid view"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                            {filteredCommunications.length > 0 && (
                                <div className="text-xs text-gray-400 font-mono">
                                    page {currentPage} of {totalPages || 1}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    viewMode === 'grid' ? <SkeletonCards /> : <SkeletonRows />
                ) : paginatedCommunications.length > 0 ? (
                    <>
                        {viewMode === 'list' ? (
                            <div className="divide-y divide-gray-100">
                                {paginatedCommunications.map((comm, index) => {
                                    const badge = getStatusBadge(comm.status);
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                    return (
                                        <div
                                            key={comm.id}
                                            className="group py-4 px-1 -mx-1 rounded-lg hover:bg-gray-50/80 cursor-pointer transition-all"
                                            onClick={() => setViewingRecord(comm)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-7 text-right">
                                                    <span className="text-sm font-mono font-medium text-gray-500">
                                                        {rowNumber}.
                                                    </span>
                                                </div>
                                                <div className="w-0.5 self-stretch bg-transparent group-hover:bg-blue-200 rounded-full transition-colors" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                                        <h3 className="text-sm font-medium text-gray-800 truncate">
                                                            {comm.particulars || 'Untitled Record'}
                                                        </h3>
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                                                                {badge.label}
                                                            </span>
                                                            <span className="text-xs text-gray-300 whitespace-nowrap">
                                                                {formatDate(comm.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            {comm.proponent || 'Unassigned'}
                                                        </span>
                                                        {comm.type && (
                                                            <>
                                                                <span className="text-gray-200">•</span>
                                                                <span className="capitalize">{comm.type}</span>
                                                            </>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            {comm.office?.name || 'Unassigned'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            {formatName(comm.incharge)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {paginatedCommunications.map((comm, index) => (
                                    <RecordCard key={comm.id} comm={comm} index={index} />
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                <div className="text-xs text-gray-400">page {currentPage} of {totalPages}</div>
                                <div className="flex gap-1">
                                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                                        className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-default transition-colors">
                                        ←
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (currentPage <= 3) pageNum = i + 1;
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = currentPage - 2 + i;
                                        return (
                                            <button key={pageNum} onClick={() => goToPage(pageNum)}
                                                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                                }`}>
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                                        className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-default transition-colors">
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-16 text-center">
                        <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 mb-2">
                            {hasActiveFilters ? 'No records match your filters.' : 'No records yet.'}
                        </p>
                        {hasActiveFilters && !isLoading && (
                            <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* View Modal */}
            <Transition.Root show={viewingRecord !== null} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setViewingRecord(null)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-[2px] transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-200"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-150"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden bg-white text-left shadow-lg transition-all sm:my-8 sm:w-full sm:max-w-lg rounded-lg">
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-t-lg" />
                                    
                                    {viewingRecord && (
                                        <>
                                            <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <Dialog.Title as="h3" className="text-base font-semibold text-gray-800">
                                                        Record Details
                                                    </Dialog.Title>
                                                </div>
                                                <button
                                                    onClick={() => setViewingRecord(null)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <span className="sr-only">Close</span>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
                                                <div className="space-y-5">
                                                    <div>
                                                        {(() => {
                                                            const badge = getStatusBadge(viewingRecord.status);
                                                            return (
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${badge.bg} ${badge.text} border ${badge.border}`}>
                                                                    <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                                                                    {badge.label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>

                                                    <div className="bg-gray-50/50 rounded-lg p-4 -mx-1">
                                                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            Particulars
                                                        </label>
                                                        <p className="text-base font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                            {viewingRecord.particulars || 'N/A'}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    Proponent
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-medium pl-5">
                                                                {viewingRecord.proponent || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    Type
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-800 capitalize font-medium pl-5">
                                                                {viewingRecord.type || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    Office
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-medium pl-5">
                                                                {viewingRecord.office?.name || 'Unassigned'}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    In-Charge
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-medium pl-5">
                                                                {formatName(viewingRecord.incharge)}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    Date Created
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-800 font-medium pl-5">
                                                                {formatFullDate(viewingRecord.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {viewingRecord.updated_at && viewingRecord.updated_at !== viewingRecord.created_at && (
                                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                <label className="text-xs font-medium uppercase tracking-wider">
                                                                    Last Updated
                                                                </label>
                                                            </div>
                                                            <p className="text-sm text-gray-600 pl-5">
                                                                {formatFullDate(viewingRecord.updated_at)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
                                                    onClick={() => setViewingRecord(null)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>
        </AuthenticatedLayout>
    );
}