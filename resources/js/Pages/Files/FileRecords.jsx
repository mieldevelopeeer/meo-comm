import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';

export default function FileRecords({ 
    auth, 
    communications = [], 
    years = [] 
}) {
    // ──────────────────────────────────────────────────────────────
    // State Management
    // ──────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('fileRecordsViewMode');
        return saved || 'grid';
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('fileRecordsItemsPerPage');
        return saved ? parseInt(saved) : 12;
    });
    const [sortBy, setSortBy] = useState(() => {
        const saved = localStorage.getItem('fileRecordsSortBy');
        return saved || 'year-desc';
    });
    const [isLoading, setIsLoading] = useState(true);

    // ──────────────────────────────────────────────────────────────
    // Effects
    // ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        localStorage.setItem('fileRecordsViewMode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('fileRecordsItemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    useEffect(() => {
        localStorage.setItem('fileRecordsSortBy', sortBy);
    }, [sortBy]);

    // ──────────────────────────────────────────────────────────────
    // Computed Values
    // ──────────────────────────────────────────────────────────────
    const availableYears = useMemo(() => {
        if (years && years.length > 0) return years;
        const yearSet = new Set(
            communications.map(comm => new Date(comm.created_at).getFullYear())
        );
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [communications, years]);

    const yearStatistics = useMemo(() => {
        const stats = {};
        availableYears.forEach(year => {
            const yearComms = communications.filter(comm => 
                new Date(comm.created_at).getFullYear() === year
            );

            let filtered = [...yearComms];
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(comm =>
                    comm.particulars?.toLowerCase().includes(q) ||
                    comm.from?.toLowerCase().includes(q) ||
                    comm.type?.toLowerCase().includes(q) ||
                    comm.office?.name?.toLowerCase().includes(q) ||
                    comm.proponent?.toLowerCase().includes(q)
                );
            }

            const statusCounts = {
                'for-filing': 0,
                'in-progress': 0,
                'completed': 0
            };

            yearComms.forEach(comm => {
                if (statusCounts.hasOwnProperty(comm.status)) {
                    statusCounts[comm.status]++;
                }
            });

            const completionRate = yearComms.length > 0 
                ? Math.round((statusCounts.completed / yearComms.length) * 100) 
                : 0;

            stats[year] = {
                total: yearComms.length,
                filtered: filtered.length,
                statusCounts,
                completionRate,
                latestDate: yearComms.length > 0 
                    ? new Date(Math.max(...yearComms.map(c => new Date(c.created_at))))
                    : null
            };
        });
        return stats;
    }, [communications, availableYears, searchQuery]);

    const filteredYears = useMemo(() => {
        let yearsList = availableYears;
        
        if (selectedYear !== 'all') {
            yearsList = yearsList.filter(year => year === parseInt(selectedYear));
        }
        
        yearsList = yearsList.filter(year => yearStatistics[year]?.filtered > 0);

        // Apply sorting
        switch (sortBy) {
            case 'year-desc':
                yearsList.sort((a, b) => b - a);
                break;
            case 'year-asc':
                yearsList.sort((a, b) => a - b);
                break;
            case 'records-desc':
                yearsList.sort((a, b) => yearStatistics[b].total - yearStatistics[a].total);
                break;
            case 'records-asc':
                yearsList.sort((a, b) => yearStatistics[a].total - yearStatistics[b].total);
                break;
            case 'completion-desc':
                yearsList.sort((a, b) => yearStatistics[b].completionRate - yearStatistics[a].completionRate);
                break;
            case 'completion-asc':
                yearsList.sort((a, b) => yearStatistics[a].completionRate - yearStatistics[b].completionRate);
                break;
            default:
                yearsList.sort((a, b) => b - a);
        }

        return yearsList;
    }, [availableYears, selectedYear, yearStatistics, sortBy]);

    const totalPages = Math.ceil(filteredYears.length / itemsPerPage);
    const paginatedYears = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredYears.slice(start, start + itemsPerPage);
    }, [filteredYears, currentPage, itemsPerPage]);

    const overallStats = useMemo(() => {
        const total = communications.length;
        const totalYears = availableYears.length;
        const avgPerYear = totalYears > 0 ? Math.round(total / totalYears) : 0;
        
        const statusCounts = {
            'for-filing': 0,
            'in-progress': 0,
            'completed': 0
        };

        communications.forEach(comm => {
            if (statusCounts.hasOwnProperty(comm.status)) {
                statusCounts[comm.status]++;
            }
        });

        const completionRate = total > 0 
            ? Math.round((statusCounts.completed / total) * 100) 
            : 0;

        return { total, totalYears, avgPerYear, statusCounts, completionRate };
    }, [communications, availableYears]);

    // ──────────────────────────────────────────────────────────────
    // Handlers
    // ──────────────────────────────────────────────────────────────
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedYear('all');
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasActiveFilters = searchQuery || selectedYear !== 'all';

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    // ──────────────────────────────────────────────────────────────
    // Loading Skeletons
    // ──────────────────────────────────────────────────────────────
    const SkeletonStats = () => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
                    <div className="h-8 w-16 bg-gray-300 rounded"></div>
                </div>
            ))}
        </div>
    );

    const SkeletonGrid = () => (
        <div className="folder-grid">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm animate-pulse">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                            <div className="h-5 w-16 bg-gray-300 rounded mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const SkeletonList = () => (
        <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                            <div className="h-5 w-16 bg-gray-300 rounded"></div>
                        </div>
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">File Records</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Archive & Records Management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {overallStats.totalYears} years
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="File Records" />

            <style>{`
                .folder-card {
                    background: white;
                    border-radius: 1rem;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid rgba(229, 231, 235, 0.8);
                    position: relative;
                    overflow: hidden;
                }
                .folder-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #60a5fa, #818cf8, #a78bfa);
                    opacity: 0;
                    transition: opacity 0.25s ease;
                }
                .folder-card:hover::before {
                    opacity: 1;
                }
                .folder-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
                    border-color: #bfdbfe;
                }
                .folder-icon {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .folder-card:hover .folder-icon {
                    transform: scale(1.1) rotate(-2deg);
                }
                .folder-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 1.25rem;
                }
                .list-item {
                    transition: all 0.2s ease;
                }
                .list-item:hover {
                    transform: translateX(4px);
                    border-color: #bfdbfe;
                }
                .progress-bar {
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 9999px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #059669);
                    transition: width 0.3s ease;
                    border-radius: 9999px;
                }
                @media (max-width: 640px) {
                    .folder-grid { grid-template-columns: 1fr; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>

            <div className="py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Filters & Controls */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="relative lg:col-span-2">
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by particulars, sender, type, office…"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-sm bg-gray-50/50 transition-all"
                                    disabled={isLoading}
                                />
                            </div>

                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-sm bg-gray-50/50 transition-all"
                                disabled={isLoading}
                            >
                                <option value="all">All years</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 text-sm bg-gray-50/50 transition-all"
                                disabled={isLoading}
                            >
                                <option value="year-desc">Newest year first</option>
                                <option value="year-asc">Oldest year first</option>
                                <option value="records-desc">Most records</option>
                                <option value="records-asc">Least records</option>
                                <option value="completion-desc">Highest completion</option>
                                <option value="completion-asc">Lowest completion</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                    {filteredYears.length} year{filteredYears.length !== 1 ? 's' : ''} 
                                    {hasActiveFilters && ' match'}
                                </span>
                                {!isLoading && filteredYears.length > 0 && (
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                                    >
                                        <option value={6}>6 per page</option>
                                        <option value={12}>12 per page</option>
                                        <option value={24}>24 per page</option>
                                        <option value={48}>48 per page</option>
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {hasActiveFilters && !isLoading && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear filters
                                    </button>
                                )}

                                {!isLoading && filteredYears.length > 0 && (
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-2.5 py-1.5 text-xs transition-colors ${
                                                viewMode === 'grid'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="Grid view"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-2.5 py-1.5 text-xs transition-colors ${
                                                viewMode === 'list'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="List view"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Year folders/list */}
                    <div className="space-y-5">
                        {isLoading ? (
                            viewMode === 'grid' ? <SkeletonGrid /> : <SkeletonList />
                        ) : paginatedYears.length > 0 ? (
                            <>
                                {viewMode === 'grid' ? (
                                    <div className="folder-grid fade-in">
                                        {paginatedYears.map((year, index) => {
                                            const stats = yearStatistics[year];
                                            return (
                                                <Link
                                                    key={year}
                                                    href={`/file-records/year/${year}`}
                                                    className="folder-card p-5 group"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="flex items-start gap-3 mb-4">
                                                        <div className="folder-icon">
                                                            <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-xl font-bold text-gray-800 leading-tight">{year}</h4>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {hasActiveFilters ? `${stats.filtered} / ${stats.total}` : stats.total} records
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500">Completion</span>
                                                            <span className="font-semibold text-emerald-600">{stats.completionRate}%</span>
                                                        </div>
                                                        <div className="progress-bar">
                                                            <div className="progress-fill" style={{ width: `${stats.completionRate}%` }}></div>
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                                    {stats.statusCounts['for-filing']}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                                                    {stats.statusCounts['in-progress']}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                                    {stats.statusCounts['completed']}
                                                                </span>
                                                            </div>
                                                            {stats.latestDate && (
                                                                <span className="text-[10px]">{formatDate(stats.latestDate)}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">Browse records</span>
                                                        <svg className="w-4 h-4 text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-2 fade-in">
                                        {paginatedYears.map((year, index) => {
                                            const stats = yearStatistics[year];
                                            return (
                                                <Link
                                                    key={year}
                                                    href={`/file-records/year/${year}`}
                                                    className="list-item flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm group"
                                                    style={{ animationDelay: `${index * 30}ms` }}
                                                >
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="folder-icon">
                                                            <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-lg font-bold text-gray-800">{year}</h4>
                                                                <span className="text-xs text-gray-400">
                                                                    {hasActiveFilters ? `${stats.filtered} / ${stats.total}` : stats.total} records
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                                    {stats.statusCounts['for-filing']} filing
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                                    {stats.statusCounts['in-progress']} progress
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                                    {stats.statusCounts['completed']} done
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-sm font-semibold text-emerald-600">{stats.completionRate}%</div>
                                                            <div className="text-xs text-gray-400">completed</div>
                                                        </div>
                                                        <svg className="w-5 h-5 text-gray-400 transform group-hover:translate-x-1 group-hover:text-blue-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm fade-in">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-base font-medium text-gray-700 mb-1">
                                    {hasActiveFilters ? 'No folders match your filters' : 'No records yet'}
                                </p>
                                <p className="text-sm text-gray-400 mb-4">
                                    {hasActiveFilters ? 'Try adjusting your search or filters' : 'Start by adding some communications'}
                                </p>
                                {hasActiveFilters && (
                                    <button 
                                        onClick={clearFilters} 
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="hidden sm:block">
                                    <p className="text-xs text-gray-500">
                                        Page {currentPage} of {totalPages} • {filteredYears.length} total
                                    </p>
                                </div>
                                <div className="flex-1 flex justify-between sm:justify-end items-center gap-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        <span className="hidden sm:inline">Previous</span>
                                    </button>
                                    
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let p;
                                            if (totalPages <= 5) p = i + 1;
                                            else if (currentPage <= 3) p = i + 1;
                                            else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
                                            else p = currentPage - 2 + i;
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => goToPage(p)}
                                                    className={`min-w-[32px] px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                                        currentPage === p
                                                            ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span className="hidden sm:inline">Next</span>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}