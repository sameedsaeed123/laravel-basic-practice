<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $orders = Order::with(['items.product', 'user'])->orderBy('id', 'desc')->get();
            return $this->success($orders, 'Orders retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve orders.', 500);
        }
    }
public function myOrders(Request $request)
    {
        try {
            $orders = Order::with('items.product')
                ->where('user_id', $request->user()->id)
                ->orderBy('id', 'desc')
                ->get();

            return $this->success($orders, 'Orders retrieved successfully.');
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve orders.', 500);
        }}

    public function show($id)
    {
        try {
            $order = Order::with(['items.product', 'user'])->findOrFail($id);
            return $this->success($order, 'Order retrieved successfully.');
        } catch (ModelNotFoundException $e) {
            return $this->error('Order not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve order.', 500);
        }
    }
    public function updateStatus($id, Request $request)
    {
        $request->validate([
            'status' => 'required|string|in:paid,processing,shipped,delivered,cancelled',
        ]);

        try {
            $order = Order::findOrFail($id);
            $order->update(['status' => $request->status]);

            return $this->success(
                $order->load(['items.product', 'user']),
                'Order status updated successfully.'
            );
        } catch (ModelNotFoundException $e) {
            return $this->error('Order not found.', 404);
        } catch (\Throwable $e) {
            return $this->error('Failed to update order status.', 500);
        }
    }
}
