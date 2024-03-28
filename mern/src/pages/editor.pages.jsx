import { useContext, useState } from 'react';
import { UserContext } from '../App';
import { Navigate } from 'react-router-dom';
import Publishform from '../components/publish-form.component';
import BlogEditor from '../components/blog-editor.component';

const Editor = () => {
  const [editorState, setEditorState] = useState('editor');

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  return access_token === null ? (
    <Navigate to="/signin" />
  ) : editorState == 'editor' ? (
    <BlogEditor />
  ) : (
    <Publishform />
  );
};

export default Editor;
