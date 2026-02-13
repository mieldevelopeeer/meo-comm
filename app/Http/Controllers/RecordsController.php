<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use App\Models\Office;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecordsController extends Controller
{
    /**
     * Display a listing of the records.
     */
    public function index()
    {
        $records = Communication::with(['office', 'incharge'])
            ->orderBy('created_at', 'desc')
            ->get();

        $offices = Office::orderBy('name')->get();

        return Inertia::render('Records/Record', [
            'records' => $records,
            'offices' => $offices,
        ]);
    }

    /**
     * Store a newly created record in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'from' => 'nullable|string|max:255',
            'particulars' => 'nullable|string',
            'proponent' => 'nullable|string|max:255',
            'offices_id' => 'required_without:new_office_name|nullable|exists:offices,id',
            'new_office_name' => 'required_without:offices_id|nullable|string|max:255',
            'place' => 'nullable|string|max:255',
            'status' => 'required|string|max:255',
            'type' => 'required|string|max:255',
        ]);

        // Handle new office creation
        if ($request->filled('new_office_name') && !$request->filled('offices_id')) {
            $office = Office::firstOrCreate(
                ['name' => $validated['new_office_name']],
                ['status' => 'active']
            );
            $validated['offices_id'] = $office->id;
        }

        // Remove new_office_name from the data to be stored
        unset($validated['new_office_name']);

        Communication::create($validated);

        return redirect()->route('records.index')
            ->with('success', 'Record created successfully.');
    }

    /**
     * Update the specified record in storage.
     */
    public function update(Request $request, Communication $record)
    {
        $validated = $request->validate([
            'from' => 'nullable|string|max:255',
            'particulars' => 'nullable|string',
            'proponent' => 'nullable|string|max:255',
            'offices_id' => 'required_without:new_office_name|nullable|exists:offices,id',
            'new_office_name' => 'required_without:offices_id|nullable|string|max:255',
            'place' => 'nullable|string|max:255',
            'status' => 'required|string|max:255',
            'type' => 'required|string|max:255',
        ]);

        // Handle new office creation
        if ($request->filled('new_office_name') && !$request->filled('offices_id')) {
            $office = Office::firstOrCreate(
                ['name' => $validated['new_office_name']],
                ['status' => 'active']
            );
            $validated['offices_id'] = $office->id;
        }

        // Remove new_office_name from the data to be stored
        unset($validated['new_office_name']);

        $record->update($validated);

        return redirect()->route('records.index')
            ->with('success', 'Record updated successfully.');
    }

    /**
     * Remove the specified record from storage.
     */
    public function destroy(Communication $record)
    {
        $record->delete();

        return redirect()->route('records.index')
            ->with('success', 'Record deleted successfully.');
    }

    /**
     * Export records to CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Communication::with(['office', 'incharge']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('offices_id')) {
            $query->where('offices_id', $request->offices_id);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        $filename = 'records-export-' . now()->format('Y-m-d-His') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($records) {
            $handle = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($handle, [
                'From',
                'Proponent',
                'Particulars',
                'Office',
                'In Charge',
                'Type',
                'Status',
                'Place',
                'Created At',
                'Updated At',
            ]);

            // Add data rows
            foreach ($records as $record) {
                fputcsv($handle, [
                    $record->from ?? 'N/A',
                    $record->proponent ?? 'N/A',
                    $record->particulars ?? 'N/A',
                    $record->office->name ?? 'N/A',
                    $record->incharge->full_name ?? 'N/A',
                    $record->type ?? 'N/A',
                    $record->status ?? 'N/A',
                    $record->place ?? 'N/A',
                    $record->created_at->format('Y-m-d H:i:s'),
                    $record->updated_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get records statistics.  
     */
    public function statistics()
    {
        $stats = [
            'total' => Communication::count(),
            'by_status' => Communication::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'by_type' => Communication::select('type', \DB::raw('count(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
            'by_office' => Office::withCount('communications')
                ->orderBy('communications_count', 'desc')
                ->limit(5)
                ->get()
                ->map(function($office) {
                    return [
                        'name' => $office->name,
                        'count' => $office->communications_count,
                    ];
                }),
            'recent' => Communication::with(['office', 'incharge'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json($stats);
    }

    /**
     * Search records.
     */
    public function search(Request $request)
    {
        $query = Communication::with(['office', 'incharge']);

        if ($request->filled('q')) {
            $searchTerm = $request->q;
            $query->where(function($q) use ($searchTerm) {
                $q->where('from', 'like', "%{$searchTerm}%")
                  ->orWhere('particulars', 'like', "%{$searchTerm}%")
                  ->orWhere('proponent', 'like', "%{$searchTerm}%")
                  ->orWhere('place', 'like', "%{$searchTerm}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('offices_id')) {
            $query->where('offices_id', $request->offices_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json($records);
    }

    /**
     * Bulk update records status.
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'record_ids' => 'required|array',
            'record_ids.*' => 'exists:communicaton,id',
            'status' => 'required|string|max:255',
        ]);

        Communication::whereIn('id', $validated['record_ids'])
            ->update(['status' => $validated['status']]);

        return redirect()->route('records.index')
            ->with('success', count($validated['record_ids']) . ' records updated successfully.');
    }

    /**
     * Bulk delete records.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'record_ids' => 'required|array',
            'record_ids.*' => 'exists:communicaton,id',
        ]);

        Communication::whereIn('id', $validated['record_ids'])->delete();

        return redirect()->route('records.index')
            ->with('success', count($validated['record_ids']) . ' records deleted successfully.');
    }
}