<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use App\Models\Office;
use App\Models\Incharge;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class FileController extends Controller
{
    /**
     * Display the file records page with communications grouped by year.
     */
    public function index(Request $request)
    {
        // Get all communications with relationships
        $communications = Communication::with(['office', 'incharge'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all offices
        $offices = Office::where('status', 'active')
            ->orderBy('name')
            ->get();

        // Get all incharges
        $incharges = Incharge::orderBy('lastname')
            ->orderBy('firstname')
            ->get();

        // Get years with communication counts
        $years = Communication::select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('year')
            ->orderBy('year', 'desc')
            ->get()
            ->pluck('year')
            ->toArray();

        return Inertia::render('Files/FileRecords', [
            'communications' => $communications,
            'offices' => $offices,
            'incharges' => $incharges,
            'years' => $years,
        ]);
    }

    /**
     * Display detailed records for a specific year
     */
    public function showYear($year)
    {
        // Validate year
        if (!is_numeric($year) || $year < 1900 || $year > 2100) {
            return redirect()->route('files.index')
                ->with('error', 'Invalid year specified');
        }

        // Get communications for the specified year
        $communications = Communication::with(['office', 'incharge'])
            ->whereYear('created_at', $year)
            ->orderBy('created_at', 'desc')
            ->get();

        // Get all offices
        $offices = Office::where('status', 'active')
            ->orderBy('name')
            ->get();

        // Get all incharges
        $incharges = Incharge::orderBy('lastname')
            ->orderBy('firstname')
            ->get();

        // Calculate statistics for the year
        $statistics = [
            'total' => $communications->count(),
            'for_filing' => $communications->where('status', 'for-filing')->count(),
            'in_progress' => $communications->where('status', 'in-progress')->count(),
            'completed' => $communications->where('status', 'completed')->count(),
        ];

        // Calculate completion rate
        $statistics['completion_rate'] = $statistics['total'] > 0 
            ? round(($statistics['completed'] / $statistics['total']) * 100, 1)
            : 0;

        return Inertia::render('Files/YearRecords', [
            'year' => $year,
            'communications' => $communications,
            'offices' => $offices,
            'incharges' => $incharges,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Get file records for a specific year.
     * This can be used for AJAX requests to load year data on demand.
     */
    public function getYearRecords(Request $request, $year)
    {
        $communications = Communication::with(['office', 'incharge'])
            ->whereYear('created_at', $year)
            ->orderBy('created_at', 'desc')
            ->get();

        // Calculate statistics for the year
        $statistics = [
            'total' => $communications->count(),
            'for_filing' => $communications->where('status', 'for-filing')->count(),
            'in_progress' => $communications->where('status', 'in-progress')->count(),
            'completed' => $communications->where('status', 'completed')->count(),
        ];

        // Calculate completion rate
        $statistics['completion_rate'] = $statistics['total'] > 0 
            ? round(($statistics['completed'] / $statistics['total']) * 100, 1)
            : 0;

        // Group by month
        $monthlyData = $communications->groupBy(function($item) {
            return date('F', strtotime($item->created_at));
        })->map(function($items, $month) {
            return [
                'month' => $month,
                'total' => $items->count(),
                'for_filing' => $items->where('status', 'for-filing')->count(),
                'in_progress' => $items->where('status', 'in-progress')->count(),
                'completed' => $items->where('status', 'completed')->count(),
                'communications' => $items,
            ];
        });

        return response()->json([
            'year' => $year,
            'statistics' => $statistics,
            'monthly_data' => $monthlyData,
            'communications' => $communications,
        ]);
    }

    /**
     * Export file records for a specific year.
     * This could export to CSV, Excel, or PDF.
     */
    public function export(Request $request, $year)
    {
        $communications = Communication::with(['office', 'incharge'])
            ->whereYear('created_at', $year)
            ->orderBy('created_at', 'desc')
            ->get();

        // Here you would implement your export logic
        // For example, using Laravel Excel or generating a PDF
        
        // For now, return as JSON (you can modify this for actual export)
        return response()->json([
            'year' => $year,
            'total_records' => $communications->count(),
            'records' => $communications,
        ]);
    }

    /**
     * Get statistics for all years.
     */
    public function getYearsStatistics()
    {
        $yearStats = Communication::select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "for-filing" THEN 1 ELSE 0 END) as for_filing'),
                DB::raw('SUM(CASE WHEN status = "in-progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->groupBy('year')
            ->orderBy('year', 'desc')
            ->get()
            ->map(function($stat) {
                $stat->completion_rate = $stat->total > 0 
                    ? round(($stat->completed / $stat->total) * 100, 1)
                    : 0;
                return $stat;
            });

        return response()->json($yearStats);
    }

    /**
     * Search file records across all years.
     */
    public function search(Request $request)
    {
        $query = Communication::with(['office', 'incharge']);

        // Search query
        if ($request->has('query') && $request->query) {
            $searchTerm = $request->query;
            $query->where(function($q) use ($searchTerm) {
                $q->where('particulars', 'like', "%{$searchTerm}%")
                  ->orWhere('from', 'like', "%{$searchTerm}%")
                  ->orWhere('proponent', 'like', "%{$searchTerm}%")
                  ->orWhere('type', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by year
        if ($request->has('year') && $request->year) {
            $query->whereYear('created_at', $request->year);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by office
        if ($request->has('office_id') && $request->office_id !== 'all') {
            $query->where('offices_id', $request->office_id);
        }

        // Filter by type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->start_date) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->where('created_at', '<=', $request->end_date);
        }

        $results = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'results' => $results,
            'count' => $results->count(),
        ]);
    }

    /**
     * Get monthly breakdown for a specific year.
     */
    public function getMonthlyBreakdown($year)
    {
        $monthlyStats = Communication::select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('MONTHNAME(created_at) as month_name'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "for-filing" THEN 1 ELSE 0 END) as for_filing'),
                DB::raw('SUM(CASE WHEN status = "in-progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->whereYear('created_at', $year)
            ->groupBy('month', 'month_name')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json($monthlyStats);
    }

    /**
     * Get records by office for a specific year.
     */
    public function getOfficeBreakdown($year)
    {
        $officeStats = Communication::select(
                'offices_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "for-filing" THEN 1 ELSE 0 END) as for_filing'),
                DB::raw('SUM(CASE WHEN status = "in-progress" THEN 1 ELSE 0 END) as in_progress'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->with('office')
            ->whereYear('created_at', $year)
            ->groupBy('offices_id')
            ->orderByDesc('total')
            ->get();

        return response()->json($officeStats);
    }

    /**
     * Archive old records (optional feature).
     * Mark communications older than a certain year as archived.
     */
    public function archive(Request $request)
    {
        $request->validate([
            'year' => 'required|integer',
        ]);

        $year = $request->year;

        // Add an 'archived' column to your communications table if needed
        // For now, we'll just demonstrate the query
        $archived = Communication::whereYear('created_at', '<', $year)
            ->update(['status' => 'archived']); // You may need to add this status

        return response()->json([
            'message' => "Successfully archived records before {$year}",
            'archived_count' => $archived,
        ]);
    }
}