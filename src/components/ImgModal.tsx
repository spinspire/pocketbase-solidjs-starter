type ImgModalProps = {
  src: string;
  full: string;
  alt?: string;
};

// Thumbnail button opening a native <dialog> lightbox with the full-size
// image. Backdrop click and close button dismiss; Escape works natively.
export default function ImgModal(props: ImgModalProps) {
  let dialog: HTMLDialogElement | undefined;

  const open = () => dialog?.showModal();
  const onBackdrop = (e: MouseEvent) => {
    if (e.target === dialog) dialog?.close();
  };

  return (
    <>
      <button type="button" class="ghost icon" onClick={open} aria-label={props.alt || "Open image"}>
        <img src={props.src} alt={props.alt ?? ""} loading="lazy" />
      </button>
      <dialog
        ref={(el) => {
          dialog = el;
        }}
        onClick={onBackdrop}
      >
        <img src={props.full} alt={props.alt ?? ""} />
        <form method="dialog">
          <button type="submit" aria-label="Close">
            Close
          </button>
        </form>
      </dialog>
    </>
  );
}
