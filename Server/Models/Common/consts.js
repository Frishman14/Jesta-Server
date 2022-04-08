const ROLES = {
    ADMIN: "admin",
    CLIENT: "client"
}

const REPORTS_STATUS = {
    PENDING: "Pending",
    HANDLING: "Handling",
    CLOSED: "Closed",
}

const PAYMENTS_TYPE = {
    PAYPAL: "Pay-pal",
    CASH: "Cash",
    FREE: "Free",
}

const RESULT = {
    OK: "Ok",
    MODIFIED: "Modified",
    LOCKED_OUT: "LockedOut"
}

const JESTA_STATUS = {
    AVAILABLE: "Available",
    UNAVAILABLE: "Unavailable"
}

const JESTA_TRANSACTION_STATUS = {
    WAITING: "Waiting",
    PENDING_FOR_OWNER: "Pending for owner",
    WAITING_FOR_JESTA_EXECUTION_TIME: "Waiting for jesta execution time",
    EXECUTOR_FINISH_JESTA: "Executor finish jesta",
    JESTA_DONE: "Jesta done"
}

exports.ROLES = ROLES
exports.RESULT = RESULT
exports.REPORT_STATUS = REPORTS_STATUS
exports.JESTA_TRANSACTION_STATUS = JESTA_TRANSACTION_STATUS
exports.JESTA_STATUS = JESTA_STATUS