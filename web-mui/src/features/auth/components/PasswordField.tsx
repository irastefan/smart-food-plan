import { useState } from "react";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { IconButton, InputAdornment, TextField, type TextFieldProps, useTheme } from "@mui/material";

export function PasswordField(props: TextFieldProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      sx={{
        "& .MuiInputBase-input": {
          color: "text.primary"
        }
      }}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={() => setVisible((current) => !current)}
                sx={{
                  color: isDark ? "rgba(226, 232, 240, 0.9)" : "inherit"
                }}
              >
                {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  );
}
