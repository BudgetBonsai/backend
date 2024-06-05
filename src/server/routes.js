// routes.js
import { register, loginGoogle, loginEmail, addTransaction, verifyToken, getTransaction } from './handler.js';

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
        path: '/transaction',
        options: {
            pre: [verifyToken]
        },
        handler: addTransaction
        
    },
    {
        method: 'GET',
        path: '/transaction',
        options: {
            pre: [verifyToken]
        },
        handler: getTransaction
        
    }
];
