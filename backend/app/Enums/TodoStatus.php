<?php

namespace App\Enums;

enum TodoStatus: string
{
    case Pending    = 'pending';
    case InProgress = 'in_progress';
    case Completed  = 'completed';
}
