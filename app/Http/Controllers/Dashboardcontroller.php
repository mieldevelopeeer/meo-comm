<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use App\Models\Office;
use App\Models\Incharge;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with optimized queries and statistics.
     */
    public function index(Request $request)
    {
        // Fetch all communications with relationships and eager load to avoid N+1 queries
        $communications = Communication::with(['office:id,name,status', 'incharge:id,firstname,middlename,lastname,suffix'])
            ->select('id', 'particulars', 'from', 'type', 'status', 'offices_id', 'incharge_id', 'created_at', 'updated_at')
            ->latest()
            ->get()
            ->map(function ($communication) {
                return [
                    'id' => $communication->id,
                    'particulars' => $communication->particulars,
                    'from' => $communication->from,
                    'type' => $communication->type,
                    'status' => $communication->status,
                    'offices_id' => $communication->offices_id,
                    'incharge_id' => $communication->incharge_id,
                    'created_at' => $communication->created_at,
                    'updated_at' => $communication->updated_at,
                    'office' => $communication->office ? [
                        'id' => $communication->office->id,
                        'name' => $communication->office->name,
                        'status' => $communication->office->status,
                    ] : null,
                    'incharge' => $communication->incharge ? [
                        'id' => $communication->incharge->id,
                        'firstname' => $communication->incharge->firstname,
                        'middlename' => $communication->incharge->middlename,
                        'lastname' => $communication->incharge->lastname,
                        'suffix' => $communication->incharge->suffix,
                    ] : null,
                ];
            });

        // Fetch all active offices with communication count
        $offices = Office::where('status', 'active')
            ->select('id', 'name', 'status')
            ->withCount([
                'communications',
                'communications as for_filing_count' => function ($query) {
                    $query->where('status', 'for-filing');
                },
                'communications as in_progress_count' => function ($query) {
                    $query->where('status', 'in_progress');
                },
                'communications as completed_count' => function ($query) {
                    $query->where('status', 'completed');
                }
            ])
            ->orderBy('name')
            ->get();

        // Fetch all in-charge persons with communication count
        $incharges = Incharge::select('id', 'firstname', 'middlename', 'lastname', 'suffix')
            ->withCount([
                'communications',
                'communications as for_filing_count' => function ($query) {
                    $query->where('status', 'for-filing');
                },
                'communications as in_progress_count' => function ($query) {
                    $query->where('status', 'in_progress');
                },
                'communications as completed_count' => function ($query) {
                    $query->where('status', 'completed');
                }
            ])
            ->orderBy('lastname')
            ->orderBy('firstname')
            ->get();

        // Calculate statistics
        $statistics = [
            'total' => $communications->count(),
            'for_filing' => $communications->where('status', 'for-filing')->count(),
            'in_progress' => $communications->where('status', 'in_progress')->count(),
            'completed' => $communications->where('status', 'completed')->count(),
            'completion_rate' => $communications->count() > 0 
                ? round(($communications->where('status', 'completed')->count() / $communications->count()) * 100, 1)
                : 0,
        ];

        // Type distribution
        $typeDistribution = $communications->groupBy('type')->map(function ($items, $type) {
            return [
                'type' => $type ?? 'other',
                'count' => $items->count(),
            ];
        })->values();

        // Recent activity (last 7 days)
        $recentActivity = [
            'today' => $communications->where('created_at', '>=', now()->startOfDay())->count(),
            'this_week' => $communications->where('created_at', '>=', now()->subWeek())->count(),
            'this_month' => $communications->where('created_at', '>=', now()->startOfMonth())->count(),
        ];

        // Top performing offices (by completion rate)
        $topOffices = $offices->filter(function ($office) {
            return $office->communications_count > 0;
        })->map(function ($office) {
            $completionRate = $office->communications_count > 0 
                ? round(($office->completed_count / $office->communications_count) * 100, 1)
                : 0;
            
            return [
                'id' => $office->id,
                'name' => $office->name,
                'total' => $office->communications_count,
                'completion_rate' => $completionRate,
            ];
        })->sortByDesc('completion_rate')->take(5)->values();

        // Top performing team members (by completion rate)
        $topIncharges = $incharges->filter(function ($incharge) {
            return $incharge->communications_count > 0;
        })->map(function ($incharge) {
            $completionRate = $incharge->communications_count > 0 
                ? round(($incharge->completed_count / $incharge->communications_count) * 100, 1)
                : 0;
            
            return [
                'id' => $incharge->id,
                'name' => trim(implode(' ', array_filter([
                    $incharge->firstname,
                    $incharge->middlename,
                    $incharge->lastname,
                ]))) . ($incharge->suffix ? ', ' . $incharge->suffix : ''),
                'total' => $incharge->communications_count,
                'completion_rate' => $completionRate,
            ];
        })->sortByDesc('completion_rate')->take(5)->values();

        return Inertia::render('Dashboard', [
            'communications' => $communications,
            'offices' => $offices,
            'incharges' => $incharges,
            'statistics' => $statistics,
            'typeDistribution' => $typeDistribution,
            'recentActivity' => $recentActivity,
            'topOffices' => $topOffices,
            'topIncharges' => $topIncharges,
        ]);
    }

    /**
     * Get dashboard statistics (for AJAX requests).
     */
    public function statistics()
    {
        $statistics = [
            'total' => Communication::count(),
            'for_filing' => Communication::where('status', 'for-filing')->count(),
            'in_progress' => Communication::where('status', 'in_progress')->count(),
            'completed' => Communication::where('status', 'completed')->count(),
        ];

        $statistics['completion_rate'] = $statistics['total'] > 0 
            ? round(($statistics['completed'] / $statistics['total']) * 100, 1)
            : 0;

        return response()->json($statistics);
    }

    /**
     * Get recent communications (for live updates).
     */
    public function recent(Request $request)
    {
        $limit = $request->input('limit', 10);

        $communications = Communication::with(['office:id,name', 'incharge:id,firstname,middlename,lastname,suffix'])
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json($communications);
    }

    /**
     * Get dashboard analytics data.
     */
    public function analytics()
    {
        // Status distribution
        $statusDistribution = Communication::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Type distribution
        $typeDistribution = Communication::select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->get();

        // Office distribution
        $officeDistribution = Communication::select('offices_id', DB::raw('count(*) as count'))
            ->with('office:id,name')
            ->groupBy('offices_id')
            ->get();

        // Incharge distribution
        $inchargeDistribution = Communication::select('incharge_id', DB::raw('count(*) as count'))
            ->with('incharge:id,firstname,middlename,lastname,suffix')
            ->groupBy('incharge_id')
            ->get();

        // Trend data (last 30 days)
        $trendData = Communication::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as total'),
                DB::raw('SUM(CASE WHEN status = "for-filing" THEN 1 ELSE 0 END) as for_filing'),
                DB::raw('SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'status_distribution' => $statusDistribution,
            'type_distribution' => $typeDistribution,
            'office_distribution' => $officeDistribution,
            'incharge_distribution' => $inchargeDistribution,
            'trend_data' => $trendData,
        ]);
    }
}