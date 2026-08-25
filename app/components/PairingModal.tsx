"use client";

import Modal from "./Modal";
import PairingPanel from "./PairingPanel";

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
