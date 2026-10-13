
// import { createContext, useEffect, useState } from "react";
// import api from "../services/api";

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {``
//     const [user, setUser] = useState(null);
//     const [loading, setLoading] = useState(true);

//     const getProfile = async () => {
//         try {
//             const token = localStorage.getItem("accessToken");

//             if (!token) {
//                 setLoading(false);
//                 return;
//             }

//             const response = await api.get("/user/profile", {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             });

//             setUser(response.data);
//         } catch (error) {
//             console.error("Profile error:", error);
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");

//             console.log("token removed")
//             setUser(null);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         getProfile();
//     }, []);

//     const login = async (email, password) => {
//         console.log(email, password);
//         const response = await api.post("/user/login", {
//             email,
//             password,
//         });

//         const { token, refreshToken, user } = response.data.data;
//         console.log(response.data.data)

//         localStorage.setItem("accessToken", token);

//         if (refreshToken) {
//             localStorage.setItem("refreshToken", refreshToken);
//         }

//         setUser(user);

//         return response.data;
//     };

//     const signup = async (name, email, password) => {
//         const response = await api.post("/user/signup", {
//             name,
//             email,
//             password,
//         });

//         return response.data;
//     };

//     const logout = async () => {
//         try {
//             const token = localStorage.getItem("accessToken");

//             await api.post(
//                 "/user/logout",
//                 {},
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );
//         } catch (error) {
//             console.error("Logout error:", error);
//         } finally {
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");
//             setUser(null);
//         }
//     };

//     return (
//         <AuthContext.Provider
//             value={{
//                 user,
//                 loading,
//                 login,
//                 signup,
//                 logout,
//                 getProfile,
//             }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// };










import { createContext, useEffect, useState } from "react";
import api from "../services/api";
import { io } from 'socket.io-client'; // Import socket.io-client
import toast from 'react-hot-toast'; // 1. Import toast

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null); // Track the socket connection

    useEffect(() => {
        // Only connect to WebSockets if we have a logged-in user
        if (user&&user._id) {
            const newSocket = io("http://localhost:3000", {
                query: { userId: user._id } // Send the user ID to the backend map
            });

            setSocket(newSocket);

            // 2. Replace the alert with a professional toast notification
            newSocket.on("new_invite", (data) => {
                // We use toast.success to give it a nice green checkmark icon!
                toast.success(`You were invited to a workspace as a ${data.role || 'member'}!`, {
                    duration: 5000, // Stays on screen for 5 seconds
                    icon: '👋', // Custom emoji icon
                });
            });

            // Cleanup when the user logs out or closes the tab
            return () => newSocket.close();
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [user]);

    const getProfile = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setLoading(false);
                return;
            }

            // Headers removed! The interceptor handles it.
            const response = await api.get("/user/profile");
            setUser(response.data);
        } catch (error) {
            console.error("Profile error:", error);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfile();
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/user/login", { email, password });
        const { token, refreshtoken, user } = response.data.data;
        console.log("ye data hai ",response.data.data)

        localStorage.setItem("accessToken", token);
        if (refreshtoken) localStorage.setItem("refreshToken", refreshtoken);
        
        setUser(user);
        return response.data;
    };

    const signup = async (name, email, password) => {
        const response = await api.post("/user/signup", { name, email, password });
        return response.data;
    };

    const logout = async () => {
        try {
            // Headers removed!
            await api.post("/user/logout", {});
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout,socket, getProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

