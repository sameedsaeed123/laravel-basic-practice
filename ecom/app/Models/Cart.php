<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = ['user_id', 'coupon_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function coupon()
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function getSubtotal(): float
    {
        return round($this->items->sum(fn ($item) => $item->product->price * $item->quantity), 2);
    }

    public function getDiscount(): float
    {
        if ($this->coupon && $this->coupon->isValid()) {
            return $this->coupon->calculateDiscount($this->getSubtotal());
        }

        return 0;
    }

    public function getTotal(): float
    {
        return round(max(0, $this->getSubtotal() - $this->getDiscount()), 2);
    }
}
