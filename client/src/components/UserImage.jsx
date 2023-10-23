import { Box } from "@mui/material";

const UserImage = ({ image, size = "60px" }) => {

  image = image && image.includes('https://') ? image
  : "http://localhost:3001/assets/" + image;

  return (
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
        src={image}
      />
    </Box>
  );
};

export default UserImage;
