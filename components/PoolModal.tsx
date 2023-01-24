import React, { useState } from "react";
import Modal from "react-overlays/Modal";
import styled from "styled-components";
import ColorScale from "color-scales";
import useSWR from "swr";
import VoteChart from "./VoteChart";

const cs3Stops = new ColorScale(0, 6, ["#ff5724", "#009485", "#2094f3"]);

const Backdrop = styled("div")`
  /* 
  position: fixed;
  z-index: 50;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #000;
  opacity: 0.5; */
`;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function PoolModal(props: {
  poolId: string;
  poolAccount: string;
  voteValue: string;
}): React.ReactElement {
  const [show, setShow] = useState(false);
  const { data: modalData } = useSWR(
    show && props.poolAccount ? ["/api/votes?poolAccount=" + props.poolAccount] : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  );
  const value = props.voteValue;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderBackdrop = (props: any) => <Backdrop onClick={() => setShow(false)} {...props} />;

  const tableStyle = {
    color: cs3Stops.getColor(parseFloat(value)).toRGBAString()
  };
  return (
    <>
      <button
        type="button"
        className="font-bold btn-xs btn btn-ghost modal-button"
        style={tableStyle}
        onClick={() => setShow(true)}
      >
        {parseFloat(value) < .5 ? ">.5%" : parseFloat(value).toFixed(2) + "%"}
      </button>
      <div className="modal">
        <div className="modal-box">
          <p>Click to get the full Modal experience!</p>

          <Modal
            show={show}
            onHide={() => setShow(false)}
            renderBackdrop={renderBackdrop}
            aria-labelledby="modal-label"
          >
            <div className="fixed top-0 bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center p-16 bg-base-300">
              <div className="absolute top-0 right-0 m-2 text-2xl font-bold">
                <button
                  className="btn btn-ghost btn-outline btn-square btn-sm"
                  onClick={() => setShow(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block w-6 h-6 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
              <div className="max-h-[100vh] ">
                {modalData && modalData.length > 0 ? (
                  <VoteChart data={modalData}></VoteChart>
                ) : (
                  <div>No data</div>
                )}
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}

export default PoolModal;
