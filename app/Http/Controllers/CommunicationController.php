<?php

namespace App\Http\Controllers;

use App\Models\Communication;
use App\Models\Office;
use App\Models\Incharge;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CommunicationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
  public function index()
{
    try {
        // Get ONLY today's communications (resets every day at midnight)
        $communications = Communication::with(['office', 'incharge'])
            ->whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->get();

        $offices = Office::orderBy('name')->get();
        $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

        return Inertia::render('Communications/Communication', [
            'communications' => $communications,
            'offices' => $offices,
            'incharges' => $incharges,
        ]);
    } catch (\Exception $e) {
        Log::error('Error loading communications index: ' . $e->getMessage());
        return Inertia::render('Communications/Communication', [
            'communications' => [],
            'offices' => [],
            'incharges' => [],
        ])->with('error', 'Failed to load communications');
    }
}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Store request data:', $request->all());

        // Start a database transaction
        DB::beginTransaction();

        try {
            // Validate all fields first - use text validation for particulars
            $validated = $request->validate([
                'type' => 'required|string|max:255|in:request,letter,other',
                'status' => 'nullable|string|max:255|in:in-progress,for-filing,completed',
                'particulars' => 'required|string', // No max limit for TEXT fields
                'proponent' => 'required|string|max:255',
                'offices_id' => 'required|exists:offices,id',
                'incharge_id' => 'nullable|exists:incharge,id',
            ]);

            // Log the length of particulars
            Log::info('Particulars length: ' . strlen($validated['particulars']));

            // Prepare communication data
            $communicationData = [
                'type' => $validated['type'],
                'from' => $validated['proponent'], // Set 'from' to proponent
                'status' => $validated['status'] ?? 'in-progress',
                'particulars' => $validated['particulars'],
                'proponent' => $validated['proponent'],
                'offices_id' => $validated['offices_id'],
                'incharge_id' => $validated['incharge_id'] ?? null,
            ];

            Log::info('Creating communication with data (preview):', [
                'type' => $communicationData['type'],
                'proponent' => $communicationData['proponent'],
                'particulars_length' => strlen($communicationData['particulars']),
                'offices_id' => $communicationData['offices_id'],
                'incharge_id' => $communicationData['incharge_id'],
            ]);

            // Create the communication
            $communication = Communication::create($communicationData);
            
            // Load relationships
            $communication->load(['office', 'incharge']);

            // Commit the transaction
            DB::commit();

            Log::info('Communication created successfully with ID: ' . $communication->id);

            return redirect()->route('communications.index')
                ->with('success', 'Communication created successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store error: ' . $e->getMessage());
            Log::error('Store error trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Failed to create communication: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Communication $communication)
    {
        Log::info('Update request data:', $request->all());

        try {
            $validated = $request->validate([
                'type' => 'required|string|max:255|in:request,letter,other',
                'status' => 'nullable|string|max:255|in:in-progress,for-filing,completed',
                'particulars' => 'required|string',
                'proponent' => 'required|string|max:255',
                'offices_id' => 'required|exists:offices,id',
                'incharge_id' => 'nullable|exists:incharge,id',
            ]);

            // Log the length of particulars
            Log::info('Update particulars length: ' . strlen($validated['particulars']));

            // Add from field and ensure status has a value
            $validated['from'] = $validated['proponent'];
            $validated['status'] = $validated['status'] ?? 'in-progress';

            Log::info('Updating communication with data (preview):', [
                'type' => $validated['type'],
                'proponent' => $validated['proponent'],
                'particulars_length' => strlen($validated['particulars']),
                'offices_id' => $validated['offices_id'],
                'incharge_id' => $validated['incharge_id'],
            ]);

            $communication->update($validated);
            
            // Load relationships
            $communication->load(['office', 'incharge']);

            Log::info('Communication updated successfully with ID: ' . $communication->id);

            return redirect()->route('communications.index')
                ->with('success', 'Communication updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Update validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            Log::error('Update error: ' . $e->getMessage());
            Log::error('Update error trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Failed to update communication: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Communication $communication)
    {
        DB::beginTransaction();

        try {
            $id = $communication->id;
            $communication->delete();
            
            DB::commit();

            Log::info('Communication deleted successfully with ID: ' . $id);

            return redirect()->back()
                ->with('success', 'Communication deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete error: ' . $e->getMessage());
            Log::error('Delete error trace: ' . $e->getTraceAsString());
            return redirect()->back()
                ->with('error', 'Failed to delete communication: ' . $e->getMessage());
        }
    }

    /**
     * API endpoint to get offices for dropdown (for AJAX calls)
     */
    public function getOffices()
    {
        try {
            $offices = Office::orderBy('name')->get();
            
            return response()->json([
                'success' => true,
                'offices' => $offices
            ]);
        } catch (\Exception $e) {
            Log::error('Get offices error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch offices'
            ], 500);
        }
    }

    /**
     * API endpoint to create a new office (for AJAX calls)
     */
    public function createOffice(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:offices,name',
                'status' => 'nullable|string|in:active,inactive'
            ]);

            $office = Office::create([
                'name' => $validated['name'],
                'status' => $validated['status'] ?? 'active'
            ]);

            // Return the newly created office with all offices
            $offices = Office::orderBy('name')->get();

            return response()->json([
                'success' => true,
                'message' => 'Office created successfully.',
                'office' => $office,
                'offices' => $offices
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Validation failed. Please check your input.'
            ], 422);
        } catch (\Exception $e) {
            Log::error('Create office error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create office: ' . $e->getMessage()
            ], 500);
        }
    }
}