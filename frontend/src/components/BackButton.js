import React from 'react';
import { IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <IconButton
      onClick={() => navigate(-1)}
      sx={{ position: 'absolute', left: 16, top: 16 }}
      color="primary"
      size="large"
    >
      <ArrowBack />
    </IconButton>
  );
};

export default BackButton;
