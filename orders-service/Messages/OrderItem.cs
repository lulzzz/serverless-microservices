﻿using System;

namespace Serverless.Messages
{
    public class OrderItem
    {
        public Guid Id { get; set; }
        public int Quantity { get; set; }
    }
}