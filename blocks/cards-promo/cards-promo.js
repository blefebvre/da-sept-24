import createResponsivePicture from '../../scripts/responsive-picture.js';

/**
 * Each row: cell 1 = promo image, cell 2 = link to the promo target.
 * The whole image becomes the link; the link text is kept as the accessible name.
 * Rows without a link render as a plain image; extra text is kept below the image.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const picture = row.querySelector('picture');
    const link = row.querySelector('a[href]');
    if (!picture && !link) return;

    const li = document.createElement('li');
    li.className = 'cards-promo-item';

    // first image = desktop artwork, optional second image = mobile artwork
    let media = null;
    if (picture) {
      const [desktopImg, mobileImg] = row.querySelectorAll('img');
      media = desktopImg
        ? createResponsivePicture(desktopImg, mobileImg, false, '750')
        : picture;
    }

    if (link) {
      const anchor = document.createElement('a');
      anchor.className = 'cards-promo-link';
      anchor.href = link.href;
      if (link.target) anchor.target = link.target;
      const label = link.textContent.trim() || link.title;
      if (label) anchor.setAttribute('aria-label', label);
      if (media) anchor.append(media);
      else {
        anchor.textContent = label || link.href;
      }
      li.append(anchor);
    } else if (media) {
      const wrapper = document.createElement('div');
      wrapper.className = 'cards-promo-image';
      wrapper.append(media);
      li.append(wrapper);
    }

    // keep any additional authored text (other than the consumed link) as a caption
    const leftover = [...row.children]
      .filter((cell) => !cell.querySelector('picture') && !cell.querySelector('a[href]'))
      .filter((cell) => cell.textContent.trim());
    if (leftover.length) {
      const caption = document.createElement('div');
      caption.className = 'cards-promo-caption';
      leftover.forEach((cell) => caption.append(...cell.childNodes));
      li.append(caption);
    }

    ul.append(li);
  });

  block.replaceChildren(ul);
}
