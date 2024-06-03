// routes.js
import { register, loginGoogle, loginEmail, addExpense, verifyToken, getExpenses } from './handler.js';

export default [
    {
        method: 'POST',
        path: '/register',
        handler: register,
    },
    {
        method: 'POST',
        path: '/login/google',
        handler: loginGoogle,
    },
    {
        method: 'POST',
        path: '/login/email',
        handler: loginEmail,
    },
    {
        method: 'POST',
        path: '/expense',
        options: {
            pre: [verifyToken]
        },
        handler: addExpense
        
    },
    {
        method: 'GET',
        path: '/expense',
        options: {
            pre: [verifyToken]
        },
        handler: getExpenses
        
    }
];
