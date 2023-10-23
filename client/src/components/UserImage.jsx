import { Box } from "@mui/material";

const UserImage = ({ image, size = "60px" }) => {

  image = image && image.includes('https://') ? image
  : "https://social-media-server-v2.vercel.app/assets/" + image;

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
