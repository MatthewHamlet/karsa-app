"use client";

import Modal from "./Modal";
import PairingPanel from "./PairingPanel";

/** `PairingPanel` in a dialog, for the places that want it without a
 *  navigation. The panel is mounted only while the dialog is open, which is
 *  what keeps the code from being minted for somebody who never asked to see
 *  one. */
export default function PairingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hubungkan lewat kode"
      description="Berikan kode ini ke orang yang kamu dampingi. Dia yang memasukkannya di aplikasinya."
    >
      {open && <PairingPanel />}
    </Modal>
  );
}
