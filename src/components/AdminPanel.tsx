'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where, Timestamp, setDoc, serverTimestamp } from 'firebase/firestore';

interface WinCodeRecord {
  id: string;
  userId: string;
  winCode: string;
  winAmount: number;
  winningWord: string | null;
  timestamp: Timestamp;
  isClaimed: boolean;
  claimedAt: Timestamp | null;
}

export default function AdminPanel() {
  const [winCodes, setWinCodes] = useState<WinCodeRecord[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<WinCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');
  const [codeToRedeem, setCodeToRedeem] = useState('');
  const [redeemMessage, setRedeemMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Paginierung
  const [currentPage, setCurrentPage] = useState(1);
  const codesPerPage = 20;

  // Helper-Funktion zum Filtern der Codes (ohne useCallback)
  const filterCodes = (codes: WinCodeRecord[], filterType: 'all' | 'claimed' | 'unclaimed') => {
    let result = [...codes];
    
    // Filter anwenden
    if (filterType === 'claimed') {
      result = result.filter(code => code.isClaimed);
    } else if (filterType === 'unclaimed') {
      result = result.filter(code => !code.isClaimed);
    }
    
    return result;
  };
  
  // Separate Funktion zum Anwenden der Filter - mit useCallback
  const applyFilters = useCallback((codes: WinCodeRecord[]) => {
    const result = filterCodes(codes, filter);
    setFilteredCodes(result);
    setCurrentPage(1); // Bei Filteränderung zur ersten Seite zurückspringen
  }, [filter]);
  
  // Funktion zum Laden der Gewinn-Codes aus Firestore
  const loadWinCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Immer alle Codes laden, um lokales Filtern zu ermöglichen
      const q = query(collection(db, "userWins"), orderBy("timestamp", "desc"));
      
      const querySnapshot = await getDocs(q);
      const codes: WinCodeRecord[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        codes.push({
          id: doc.id,
          userId: data.userId,
          winCode: data.winCode,
          winAmount: data.winAmount,
          winningWord: data.winningWord,
          timestamp: data.timestamp,
          isClaimed: data.isClaimed,
          claimedAt: data.claimedAt,
        });
      });
      
      setWinCodes(codes);
      
      // Nach dem Laden die Filter anwenden
      const filteredResult = filterCodes(codes, filter);
      setFilteredCodes(filteredResult);
    } catch (err) {
      console.error("Fehler beim Laden der Gewinn-Codes:", err);
      setError("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);
  
  // Lade die Gewinn-Codes beim ersten Rendern
  useEffect(() => {
    loadWinCodes();
  }, [loadWinCodes]);
  
  // Wende Filter an, wenn sich der Filter ändert
  useEffect(() => {
    if (winCodes.length > 0) {
      applyFilters(winCodes);
    }
  }, [filter, applyFilters, winCodes]);
  
  // Berechne die aktuellen Codes für die Seite
  const indexOfLastCode = currentPage * codesPerPage;
  const indexOfFirstCode = indexOfLastCode - codesPerPage;
  const currentCodes = filteredCodes.slice(indexOfFirstCode, indexOfLastCode);
  const totalPages = Math.ceil(filteredCodes.length / codesPerPage);
  
  // Funktion zum Ändern der Seite
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Hier haben wir die redeemCode-Funktion entfernt, da wir nur redeemCodeDirectly verwenden

  // Funktion, um einen Code direkt in Firestore als eingelöst zu markieren (ohne Cloud Function)
  const redeemCodeDirectly = async () => {
    if (!codeToRedeem || codeToRedeem.length !== 6) {
      setRedeemMessage({
        text: "Bitte geben Sie einen gültigen 6-stelligen Code ein.",
        type: "error"
      });
      return;
    }

    setIsProcessing(true);
    setRedeemMessage(null);

    try {
      console.log("Versuche Code direkt in Firestore einzulösen:", codeToRedeem);
      
      // Suche nach dem Code in der Firestore-Datenbank
      const userWinsRef = collection(db, "userWins");
      const q = query(userWinsRef, where("winCode", "==", codeToRedeem));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("Kein Gewinncode gefunden mit:", codeToRedeem);
        setRedeemMessage({
          text: `Kein gültiger Gewinncode gefunden: ${codeToRedeem}`,
          type: "error"
        });
        return;
      }
      
      // Code gefunden, überprüfen, ob er bereits eingelöst wurde
      const docRef = querySnapshot.docs[0].ref;
      const winData = querySnapshot.docs[0].data();
      
      if (winData.isClaimed) {
        console.log("Code wurde bereits eingelöst:", codeToRedeem);
        setRedeemMessage({
          text: `Der Code ${codeToRedeem} wurde bereits eingelöst.`,
          type: "error"
        });
        return;
      }
      
      // Code als eingelöst markieren
      await setDoc(docRef, {
        isClaimed: true,
        claimedAt: serverTimestamp()
      }, { merge: true });
      
      console.log("Code erfolgreich als eingelöst markiert:", codeToRedeem);
      setRedeemMessage({
        text: `Code ${codeToRedeem} erfolgreich eingelöst!`,
        type: "success"
      });
      
      // Codes neu laden und Formular zurücksetzen
      loadWinCodes();
      setCodeToRedeem('');
    } catch (err) {
      console.error("Fehler beim direkten Einlösen des Codes:", err);
      let errorMessage = "Ein Fehler ist beim direkten Einlösen aufgetreten.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setRedeemMessage({
        text: errorMessage,
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatiert ein Timestamp-Objekt zu einem lesbaren Datum
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "—";
    
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-5 text-gray-800">Code einlösen</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <input
            type="text"
            value={codeToRedeem}
            onChange={(e) => setCodeToRedeem(e.target.value.toUpperCase())}
            placeholder="XX9999"
            className="p-3 border-2 border-gray-300 rounded-md w-full md:w-64 focus:border-yellow-500 focus:outline-none transition-colors duration-200 text-center uppercase font-mono tracking-wider"
            maxLength={6}
          />
          <button
            onClick={redeemCodeDirectly}
            disabled={isProcessing}
            className="bg-yellow-500 text-black font-bold py-2 px-4 rounded shadow-lg hover:bg-yellow-400 disabled:bg-gray-400 disabled:text-gray-700 transition-colors duration-200"
          >
            {isProcessing ? "Wird eingelöst..." : "Code einlösen"}
          </button>
        </div>
        
        {redeemMessage && (
          <div className={`mt-4 p-4 rounded-md border ${redeemMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {redeemMessage.text}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Gewinn-Codes</h2>
        
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <label className="mr-2 font-medium">Filter:</label>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'claimed' | 'unclaimed')}
              className="p-2 border rounded"
            >
              <option value="all">Alle Codes</option>
              <option value="claimed">Eingelöste Codes</option>
              <option value="unclaimed">Nicht eingelöste Codes</option>
            </select>
          </div>
          
          <button 
            onClick={() => loadWinCodes()}
            className="flex items-center gap-1 bg-gray-200 py-2 px-3 rounded hover:bg-gray-300 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Aktualisieren</span>
          </button>
          
          <div className="ml-auto text-sm text-gray-600">
            {filteredCodes.length} Code{filteredCodes.length !== 1 ? 's' : ''} gefunden
          </div>
        </div>

        {isLoading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Lade Gewinn-Codes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded">
            {error}
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-gray-500 text-center p-8">
            Keine Gewinn-Codes gefunden.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left">Code</th>
                    <th className="py-2 px-3 text-left">Benutzer</th>
                    <th className="py-2 px-3 text-left">Gewinn</th>
                    <th className="py-2 px-3 text-left">Datum</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Eingelöst am</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCodes.map((code) => (
                    <tr key={code.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono">{code.winCode}</td>
                      <td className="py-2 px-3">{code.userId.substring(0, 8)}...</td>
                      <td className="py-2 px-3">
                        {code.winAmount}x 
                        {code.winningWord && <span className="ml-2 text-sm">({code.winningWord})</span>}
                      </td>
                      <td className="py-2 px-3">{formatDate(code.timestamp)}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs ${code.isClaimed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {code.isClaimed ? 'Eingelöst' : 'Nicht eingelöst'}
                        </span>
                      </td>
                      <td className="py-2 px-3">{formatDate(code.claimedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded disabled:opacity-50"
                  aria-label="Vorherige Seite"
                >
                  &laquo;
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNumber => {
                      // Zeige nur Seiten in der Nähe der aktuellen Seite und erste/letzte Seite
                      return pageNumber === 1 || 
                             pageNumber === totalPages || 
                             Math.abs(pageNumber - currentPage) <= 1;
                    })
                    .map((pageNumber, index, array) => {
                      // Füge Ellipsis zwischen nicht aufeinanderfolgenden Seitenzahlen ein
                      const prevPage = array[index - 1];
                      const showEllipsis = prevPage && pageNumber - prevPage > 1;
                      
                      return (
                        <React.Fragment key={pageNumber}>
                          {showEllipsis && (
                            <span className="px-3 py-2 border rounded bg-gray-100">...</span>
                          )}
                          <button
                            onClick={() => paginate(pageNumber)}
                            className={`px-3 py-2 border rounded ${currentPage === pageNumber ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-100'}`}
                          >
                            {pageNumber}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded disabled:opacity-50"
                  aria-label="Nächste Seite"
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
