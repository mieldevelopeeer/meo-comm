<?php

namespace App\Http\Controllers;

use App\Models\Office;
use App\Models\Communication;
use App\Models\Incharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OfficeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $offices = Office::orderBy('name')->get();
        
        return response()->json([
            'success' => true,
            'offices' => $offices
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        \Log::info('Office store request data:', $request->all());

        DB::beginTransaction();

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:offices,name',
                'status' => 'nullable|string|in:active,inactive',
            ]);

            // Set default status if not provided
            if (!isset($validated['status'])) {
                $validated['status'] = 'active';
            }

            $office = Office::create($validated);

            DB::commit();

            \Log::info('Office created:', [
                'id' => $office->id,
                'name' => $office->name
            ]);

            // Get updated lists for all data
            $communications = Communication::with(['office', 'incharge'])
                ->latest()
                ->get();
            $offices = Office::orderBy('name')->get();
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'Office created successfully.')
                ->with('communications', $communications)
                ->with('offices', $offices)
                ->with('incharges', $incharges);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Office validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Office store error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to create office: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Office $office)
    {
        \Log::info('Office update request data:', $request->all());

        DB::beginTransaction();

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:offices,name,' . $office->id,
                'status' => 'nullable|string|in:active,inactive',
            ]);

            $office->update($validated);

            DB::commit();

            // Get updated list of all offices
            $communications = Communication::with(['office', 'incharge'])
                ->latest()
                ->get();
            $offices = Office::orderBy('name')->get();
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'Office updated successfully.')
                ->with('communications', $communications)
                ->with('offices', $offices)
                ->with('incharges', $incharges);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Office update validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Office update error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to update office: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Office $office)
    {
        DB::beginTransaction();

        try {
            $office->delete();
            
            DB::commit();

            // Get updated list of all offices
            $communications = Communication::with(['office', 'incharge'])
                ->latest()
                ->get();
            $offices = Office::orderBy('name')->get();
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'Office deleted successfully.')
                ->with('communications', $communications)
                ->with('offices', $offices)
                ->with('incharges', $incharges);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Office delete error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to delete office: ' . $e->getMessage());
        }
    }
}