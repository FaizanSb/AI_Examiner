import { useState, useEffect } from "react";

function useAuth() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setTeacher(null);
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setTeacher(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error("useAuth error:", err);
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, []);

  return { teacher, loading };
}

export default useAuth;