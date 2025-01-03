import jwt from 'jsonwebtoken'
import {TOKEN_SECRET} from '../config.js'

export const authRequired = (req, res, next) => {
            const { token } = req.cookies;
        
            if (!token) {
                console.log('No se encontró token en las cookies');
                return res.status(401).json({ message: "No token, authorization denied" });
            }
        
            jwt.verify(token, TOKEN_SECRET, (err, user) => {
                if (err) {
                    console.log('Token inválido:', err);
                    return res.status(403).json({ message: 'Invalid token' });
                }
        
                // console.log('Token válido. Usuario decodificado:', user);
                req.user = user;
        
                next();
            });
        }; 
        