import React, { useRef } from 'react';
import logo from '../imgs/logo.png';
import { Link } from 'react-router-dom';
import AnimationWrapper from '../common/page-animation';
import defaultBanner from '../imgs/blog banner.png';
import { uploadImage } from '../common/aws';
import { Toaster, toast } from 'react-hot-toast';

const BlogEditor = () => {
  let blogBannerRef = useRef();

  const handleBannerUpload = (e) => {
    let img = e.target.files[0];
    if (img) {
      let loadingToast = toast.loading('Uploading...');
      uploadImage(img)
        .then((url) => {
          if (url) {
            toast.dismiss(loadingToast);
            toast.success('Upload success');
            blogBannerRef.current.src = url;
          }
        })
        .catch((err) => {
          return toast.error(err);
        });
    }
  };
  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.perventDefault();
    }
  };
  const handleTitleChange = (e) => {
    let input = e.target;
    console.log(input);
  };
  return (
    <>
      <nav className="navbar">
        <Toaster />
        <Link to="/" className="flex-none w-10">
          <img src={logo.png} />
        </Link>
        <p className="max-md: hidden text-black line-clamp-1 w-full"></p>
        New Blog3
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2">Publish</button>
          <button className="btn-light py-2">Save Draft</button>
        </div>
      </nav>
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div
              className="relative aspect-video
                hover:opacity-80
                bg-white border-4
                border-grey"
            >
              <label htmlFor="uploadBanner">
                <img ref={blogBannerRef} src={defaultBanner} className="z-20" />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>
            <textarea
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none mt-10 leading-tight placeholder-opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>
          </div>
        </section>
      </AnimationWrapper>
      ;
    </>
  );
};

export default BlogEditor;
