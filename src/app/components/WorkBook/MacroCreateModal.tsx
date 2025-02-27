import React, { useState } from "react";
import { api } from "~/trpc/react";
import Modal from "../Modal";
import MacroForm from "./MacroForm";

const MacroCreateModel = ({
  showModal,
  closeModal,
}: {
  showModal: boolean;
  closeModal: () => void;
}) => {

  return (
    <>
      {showModal ? (
        <Modal onClose={closeModal}>
          <MacroForm close={closeModal} />
        </Modal>
      ) : null}
    </>
  );
};

export default MacroCreateModel;
