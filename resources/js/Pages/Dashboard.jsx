import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Dashboard({ 
    auth, 
    communications = [], 
    offices = [], 
    incharges = [],
    statistics = { total: 0, for_filing: 0, in_progress: 0, completed: 0, completion_rate: 0 },
    typeDistribution = [],
    recentActivity = { today: 0, this_week: 0, this_month: 0 },
    topOffices = [],
    topIncharges = []
}) {
    const [activeTab, setActiveTab] = useState('overview');

    // ──────────────────────────────────────────────────────────────
    // Status dot configuration – minimal, like YearRecords
    // ──────────────────────────────────────────────────────────────
    const statusDot = {
        'for-filing': 'bg-amber-500',
        'in-progress': 'bg-blue-500',
        'completed': 'bg-emerald-500',
    };

    const getStatusDot = (status) => statusDot[status] || 'bg-gray-400';
    const getStatusLabel = (status) => 
        status === 'for-filing' ? 'For Filing' :
        status === 'in-progress' ? 'In Progress' :
        status === 'completed' ? 'Completed' : 'Unknown';

    // ──────────────────────────────────────────────────────────────
    // Derived stats (memoized)
    // ──────────────────────────────────────────────────────────────
    const statusCounts = useMemo(() => ({
        all: statistics.total || communications.length,
        forFiling: statistics.for_filing || communications.filter(c => c.status === 'for-filing').length,
        inProgress: statistics.in_progress || communications.filter(c => c.status === 'in-progress').length,
        completed: statistics.completed || communications.filter(c => c.status === 'completed').length,
    }), [communications, statistics]);

    const completionRate = useMemo(() => {
        if (statistics.completion_rate !== undefined) return statistics.completion_rate;
        if (statusCounts.all === 0) return 0;
        return ((statusCounts.completed / statusCounts.all) * 100).toFixed(1);
    }, [statusCounts, statistics]);

    const activityStats = useMemo(() => ({
        today: recentActivity.today || communications.filter(c => {
            const today = new Date();
            const createdAt = new Date(c.created_at);
            return createdAt.toDateString() === today.toDateString();
        }).length,
        thisWeek: recentActivity.this_week || communications.filter(c => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(c.created_at) >= weekAgo;
        }).length,
        thisMonth: recentActivity.this_month || communications.filter(c => {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            return new Date(c.created_at) >= monthStart;
        }).length,
    }), [communications, recentActivity]);

    const officeStats = useMemo(() => 
        offices.map(office => ({
            office,
            count: office.communications_count || communications.filter(c => c.offices_id === office.id).length,
            forFiling: office.for_filing_count || communications.filter(c => c.offices_id === office.id && c.status === 'for-filing').length,
            inProgress: office.in_progress_count || communications.filter(c => c.offices_id === office.id && c.status === 'in-progress').length,
            completed: office.completed_count || communications.filter(c => c.offices_id === office.id && c.status === 'completed').length,
        })).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count).slice(0, 5),
        [communications, offices]
    );

    const inchargeStats = useMemo(() => 
        incharges.map(incharge => ({
            incharge,
            count: incharge.communications_count || communications.filter(c => c.incharge_id === incharge.id).length,
            forFiling: incharge.for_filing_count || communications.filter(c => c.incharge_id === incharge.id && c.status === 'for-filing').length,
            inProgress: incharge.in_progress_count || communications.filter(c => c.incharge_id === incharge.id && c.status === 'in-progress').length,
            completed: incharge.completed_count || communications.filter(c => c.incharge_id === incharge.id && c.status === 'completed').length,
        })).filter(stat => stat.count > 0).sort((a, b) => b.count - a.count).slice(0, 6),
        [communications, incharges]
    );

    const typeStats = useMemo(() => {
        if (typeDistribution && typeDistribution.length > 0) {
            return typeDistribution.reduce((acc, item) => {
                acc[item.type] = item.count;
                return acc;
            }, {});
        }
        return communications.reduce((acc, comm) => {
            const type = comm.type || 'other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
    }, [communications, typeDistribution]);

    // ──────────────────────────────────────────────────────────────
    // Formatters
    // ──────────────────────────────────────────────────────────────
    const formatName = (incharge) => {
        if (!incharge) return 'Unassigned';
        const parts = [incharge.firstname, incharge.middlename, incharge.lastname].filter(Boolean);
        const name = parts.join(' ');
        return incharge.suffix ? `${name}, ${incharge.suffix}` : name;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        });
    };

    // Recent communications – top 5 for the activity feed
    const recentCommunications = useMemo(() => 
        [...communications]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5),
    [communications]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">
                            Welcome back, {auth.user?.name || 'User'}
                        </p>
                        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
                    </div>
                    <span className="text-sm text-gray-400">
                        {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                    </span>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ──────────────────────────────────────────── */}
                    {/* KPI Cards – clean, minimal */}
                    {/* ──────────────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { 
                                label: 'Total Communications', 
                                value: statusCounts.all, 
                                color: 'blue',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                )
                            },
                            { 
                                label: 'For Filing', 
                                value: statusCounts.forFiling, 
                                color: 'amber',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )
                            },
                            { 
                                label: 'In Progress', 
                                value: statusCounts.inProgress, 
                                color: 'blue',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )
                            },
                            { 
                                label: 'Completed', 
                                value: statusCounts.completed, 
                                color: 'emerald',
                                icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            },
                        ].map((stat, idx) => (
                            <div 
                                key={idx} 
                                className="bg-white rounded-lg border border-gray-100 px-5 py-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2.5 rounded-lg bg-${stat.color}-50/60`}>
                                        <span className={`text-${stat.color}-600`}>{stat.icon}</span>
                                    </div>
                                    <div className={`text-2xl font-semibold text-${stat.color}-700`}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {stat.label}
                                </div>
                                {stat.label === 'Completed' && (
                                    <div className="text-xs text-gray-400 mt-1.5">
                                        {completionRate}% completion rate
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ──────────────────────────────────────────── */}
                    {/* Tab Navigation – minimal underline */}
                    {/* ──────────────────────────────────────────── */}
                    <div className="bg-white rounded-lg border border-gray-100">
                        <div className="flex border-b border-gray-100">
                            {['overview', 'analytics'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        px-5 py-3 text-sm font-medium capitalize transition-colors
                                        ${activeTab === tab 
                                            ? 'text-blue-600 border-b-2 border-blue-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                        }
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ──────────────────────────────────────────── */}
                    {/* Overview Tab – professional, no tables */}
                    {/* ──────────────────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            
                            {/* Activity + Recent Communications */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Activity summary */}
                                <div className="lg:col-span-1 bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-xs text-gray-600">Today</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{activityStats.today}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <span className="text-xs text-gray-600">This week</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{activityStats.thisWeek}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                <span className="text-xs text-gray-600">This month</span>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">{activityStats.thisMonth}</span>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Completion rate</span>
                                            <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                            <div 
                                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Recent communications – with minimal status dots */}
                                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-700">Recent activity</h3>
                                        <span className="text-xs text-gray-400">Latest 5</span>
                                    </div>
                                    <div className="space-y-3">
                                        {recentCommunications.length > 0 ? (
                                            recentCommunications.map((comm) => (
                                                <div 
                                                    key={comm.id} 
                                                    className="flex items-start gap-3 py-2 px-1 -mx-1 rounded-lg hover:bg-gray-50/80 transition-colors"
                                                >
                                                    {/* Status dot + label – minimal, consistent with YearRecords */}
                                                    <div className="flex-shrink-0 flex items-center gap-1.5 min-w-[90px]">
                                                        <span className={`w-2 h-2 rounded-full ${getStatusDot(comm.status)}`} />
                                                        <span className="text-xs font-medium text-gray-600">
                                                            {getStatusLabel(comm.status)}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                                {comm.particulars || 'Untitled'}
                                                            </p>
                                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                                {formatDate(comm.created_at)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                                            <span className="truncate">{comm.office?.name || 'Unassigned'}</span>
                                                            {comm.type && (
                                                                <>
                                                                    <span className="text-gray-300">•</span>
                                                                    <span className="capitalize truncate">{comm.type}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 py-2">No recent communications</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Top Offices & Team Members */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Offices */}
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Top offices</h3>
                                    <div className="space-y-3">
                                        {officeStats.slice(0, 5).map((stat, idx) => (
                                            <div key={stat.office.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-gray-400 w-5">{idx + 1}.</span>
                                                    <span className="text-sm font-medium text-gray-700">{stat.office.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{stat.count} records</span>
                                                    <span className="text-xs font-medium text-emerald-600">
                                                        {stat.count > 0 ? ((stat.completed / stat.count) * 100).toFixed(0) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {officeStats.length === 0 && (
                                            <p className="text-sm text-gray-400 py-2">No office data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Top Team Members */}
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Top team members</h3>
                                    <div className="space-y-3">
                                        {inchargeStats.slice(0, 5).map((stat, idx) => (
                                            <div key={stat.incharge.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono text-gray-400 w-5">{idx + 1}.</span>
                                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                                                        {formatName(stat.incharge)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{stat.count} records</span>
                                                    <span className="text-xs font-medium text-emerald-600">
                                                        {stat.count > 0 ? ((stat.completed / stat.count) * 100).toFixed(0) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {inchargeStats.length === 0 && (
                                            <p className="text-sm text-gray-400 py-2">No team data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Communication Types */}
                            <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Communication types</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(typeStats)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 6)
                                        .map(([type, count]) => {
                                            const percentage = ((count / statusCounts.all) * 100).toFixed(1);
                                            return (
                                                <div key={type} className="flex items-center gap-3 py-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500/60" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium text-gray-700 capitalize">
                                                                {type}
                                                            </span>
                                                            <span className="text-xs font-mono text-gray-500">{count}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                                                            <div 
                                                                className="bg-blue-500/60 h-1 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──────────────────────────────────────────── */}
                    {/* Analytics Tab – refined, Tailwind only */}
                    {/* ──────────────────────────────────────────── */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            
                            {/* Activity Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Today</div>
                                    <div className="text-2xl font-semibold text-gray-800">{activityStats.today}</div>
                                    <div className="text-xs text-gray-400 mt-1">communications added</div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">This week</div>
                                    <div className="text-2xl font-semibold text-gray-800">{activityStats.thisWeek}</div>
                                    <div className="text-xs text-gray-400 mt-1">last 7 days</div>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">This month</div>
                                    <div className="text-2xl font-semibold text-gray-800">{activityStats.thisMonth}</div>
                                    <div className="text-xs text-gray-400 mt-1">monthly total</div>
                                </div>
                            </div>

                            {/* Top Performers */}
                            {(topOffices.length > 0 || topIncharges.length > 0) && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {topOffices.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top offices</h3>
                                            <div className="space-y-3">
                                                {topOffices.map((office, idx) => (
                                                    <div key={office.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-700 bg-blue-50 rounded-md">
                                                                {idx + 1}
                                                            </span>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-800">{office.name}</div>
                                                                <div className="text-xs text-gray-500">{office.total} total</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-base font-semibold text-blue-600">{office.completion_rate}%</div>
                                                            <div className="text-xs text-gray-500">completed</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {topIncharges.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top team members</h3>
                                            <div className="space-y-3">
                                                {topIncharges.map((member, idx) => (
                                                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md">
                                                                {idx + 1}
                                                            </span>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-800">{member.name}</div>
                                                                <div className="text-xs text-gray-500">{member.total} total</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-base font-semibold text-emerald-600">{member.completion_rate}%</div>
                                                            <div className="text-xs text-gray-500">completed</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Office & Type Analytics */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Office performance</h3>
                                    <div className="space-y-4">
                                        {officeStats.map((stat) => {
                                            const rate = stat.count > 0 ? ((stat.completed / stat.count) * 100).toFixed(1) : 0;
                                            return (
                                                <div key={stat.office.id}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-sm font-medium text-gray-700">{stat.office.name}</span>
                                                        <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                                                    </div>
                                                    <div className="flex gap-2 text-xs">
                                                        <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md">{stat.forFiling} filing</span>
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md">{stat.inProgress} active</span>
                                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">{stat.completed} done</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Communication types</h3>
                                    <div className="space-y-4">
                                        {Object.entries(typeStats)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 5)
                                            .map(([type, count]) => {
                                                const percentage = ((count / statusCounts.all) * 100).toFixed(1);
                                                return (
                                                    <div key={type}>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                                                            <span className="text-sm font-semibold text-gray-900">{count}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                                            <div 
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            {/* Team Performance */}
                            <div className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">Team performance</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {inchargeStats.map((stat) => {
                                        const rate = stat.count > 0 ? ((stat.completed / stat.count) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={stat.incharge.id} className="p-4 bg-gray-50/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-gray-800 truncate">
                                                        {formatName(stat.incharge)}
                                                    </span>
                                                    <span className="text-lg font-semibold text-gray-900">{stat.count}</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center p-1.5 bg-amber-50 rounded-md">
                                                        <div className="text-sm font-semibold text-amber-700">{stat.forFiling}</div>
                                                        <div className="text-xs text-amber-600">Filing</div>
                                                    </div>
                                                    <div className="text-center p-1.5 bg-blue-50 rounded-md">
                                                        <div className="text-sm font-semibold text-blue-700">{stat.inProgress}</div>
                                                        <div className="text-xs text-blue-600">Active</div>
                                                    </div>
                                                    <div className="text-center p-1.5 bg-emerald-50 rounded-md">
                                                        <div className="text-sm font-semibold text-emerald-700">{stat.completed}</div>
                                                        <div className="text-xs text-emerald-600">Done</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}