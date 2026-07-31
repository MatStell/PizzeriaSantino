import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy as fbOrderBy,
  limit as fbLimit,
  query,
} from "firebase/firestore";
import { db } from "../firebase.js";

// Realtime subscription to a Firestore collection.
export function useCollection(path, { orderByField, direction = "desc", limitTo } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [];
    if (orderByField) constraints.push(fbOrderBy(orderByField, direction));
    if (limitTo) constraints.push(fbLimit(limitTo));
    const ref = collection(db, path);
    const q = constraints.length ? query(ref, ...constraints) : ref;

    const unsubscribe = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, orderByField, direction, limitTo]);

  return { data, loading };
}
