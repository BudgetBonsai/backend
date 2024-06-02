// routes.js
import { register, loginGoogle, loginEmail } from './handler.js';

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
    }
];
