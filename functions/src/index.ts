import {logger} from "firebase-functions";
import {onCall, HttpsError, CallableRequest} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialisiert die Firebase Admin SDK.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

interface ClaimWinCodeData {
  winCode: string;
}

/**
 * Callable Cloud Function zum Einlösen eines Gewinncodes.
 * Erwartet 'winCode' im Datenobjekt.
 */
export const claimWinCode = onCall(
  {region: "europe-west1"},
  async (request: CallableRequest<ClaimWinCodeData>) => {
    // Überprüfen, ob der Aufrufer authentifiziert ist
    // if (!request.auth) {
    //   throw new HttpsError('unauthenticated',
    //     'Die Funktion kann nur von authentifizierten Benutzern aufgerufen werden.');
    // }

    const winCode = request.data.winCode;

    if (!winCode || typeof winCode !== "string" || winCode.length !== 6) {
      throw new HttpsError(
        "invalid-argument",
        "Code fehlt, ist ungültig oder " +
          "hat falsches Format."
      );
    }

    const userWinsRef = db.collection("userWins");

    return db
      .runTransaction(async (transaction) => {
        const query = userWinsRef.where("winCode", "==", winCode).limit(1);
        const snapshot = await transaction.get(query);

        if (snapshot.empty) {
          const anyCodeQuery = userWinsRef.where("winCode", "==", winCode).limit(1);
          const anyCodeSnapshot = await anyCodeQuery.get();

          if (!anyCodeSnapshot.empty && anyCodeSnapshot.docs[0].data().isClaimed) {
            return {
              success: false,
              message: `Code ${winCode} schon genutzt.`,
            };
          }
          return {
            success: false,
            message: `Code ${winCode} ungültig.`,
          };
        }

        const winDoc = snapshot.docs[0];
        const winData = winDoc.data();

        if (winData.isClaimed) {
          return {
            success: false,
            message: `Code ${winCode} schon genutzt.`,
          };
        }

        transaction.update(winDoc.ref, {
          isClaimed: true,
          claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
          success: true,
          message: `Gewinncode ${winCode} erfolgreich für Benutzer ` +
                   `${winData.userId} eingelöst.`,
        };
      })
      .catch((error) => {
        logger.error("Fehler beim Einlösen des Gewinncodes:",
          {winCode, errorDetails: error.message});
        if (error instanceof HttpsError) {
          throw error;
        }
        throw new HttpsError(
          "internal",
          "Ein interner Fehler ist beim Einlösen des Codes aufgetreten."
        );
      });
  }
);
