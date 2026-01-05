export interface YPOEvent {
  id: string;
  name: string;
  timeZone?: string;
  type?: string;
  locationType?: string;
  audience?: string[];
  programFormat?: string;
  status?: string;
  focus?: string[];
  url?: string;
  programOwner?: string;
  sponsors?: string[];
  networks?: string[];
  sponsorshipType?: string;
}

// Parse CSV data into structured event objects
const rawEventData = `Chapter Pro,Eastern Time,Virtual,Virtual,Members;Spouse/Partners,Chapter Event,Completed,Business,https://sandbox-events.ypo.org/d/tsqr7n,Networks,Network;Network,Spouse/Partner Community;Parenting Community,Chapter
ChapterPro Import template testing 59000,America/New_York,In person,In person,,Global Conference Call (GCC),Completed,Family,https://event.ypo.org/d/jyq8yp?RefID=CNT,,,,Network
GCC: Empowering Our Children to be Responsible Independent Adults,,,,Members;Spouse/Partners,Non-Chapter Event,Closed,Business,https://events.zoom.us/ev/AhTxA3KNxx9Pxs_JpUlInR5vff7ta6DwmCswx-AJLgXVbSYxBwSm~AizHGTHU8JdO1BI4zmQRFfJf33SK6ezf2nS_5FtgIkRYUShG_XiXs5q_2w,,Chapter,,Global
In Person Meetup: ULI Fall Meeting,Eastern Time,,,Members;Spouse/Partners,Chapter Event,Pending,Business,https://sandbox-events.ypo.org/d/fsqf29,Networks,Network,Health and Wellness Network,Chapter
GCC: The Secret Power of Fasting for Longevity and Healing,Alaskan Time,,,,Non-Chapter Event,No Registration Required,Business|Family|Impact,,,,,Global
Entrepreneurship Network Meet Up Around the World: Denver,America/Chicago,,,,Chapter Event,Completed,Business,https://event.ypo.org/d/kgqtfk?RefID=CNT,,,,Chapter
Meet Up: Happy Hour in Bangkok - September 2025,America/Chicago,,,,Chapter Event,Completed,YPO Champion & Membership,https://event.ypo.org/d/0vq97b?RefID=CNT,,,,Chapter
Automotive Network Meet Up: During Automechanika- Dubai December 2025,Eastern Time,,,,Chapter Event,Completed,Business,http://event.ypowpo.org/d/ybqbw9?RefID=CNT,Networks,Network;Network;Network,Investing Network;Leadership Development Network;Spouse/Partner Community,Chapter
Meet Up: Happy Hour in Detroit - October 2025,Eastern Time,,,,,,Business,https://sandbox-events.ypo.org/d/ssqw13,,Chapter,,Chapter
Meet Up: Happy Hour in Dallas - September 2025,,,,,,,,,,,,`;

export const ypoEvents: YPOEvent[] = rawEventData.split("\n").map((line, index) => {
  const parts = line.split(",");
  return {
    id: `event-${index + 1}`,
    name: parts[0] || "Untitled Event",
    timeZone: parts[1] || undefined,
    type: parts[2] || undefined,
    locationType: parts[3] || undefined,
    audience: parts[4] ? parts[4].split(";").filter(Boolean) : [],
    programFormat: parts[5] || undefined,
    status: parts[6] || undefined,
    focus: parts[7] ? parts[7].split("|").filter(Boolean) : [],
    url: parts[8] || undefined,
    programOwner: parts[9] || undefined,
    sponsors: parts[10] ? parts[10].split(";").filter(Boolean) : [],
    networks: parts[11] ? parts[11].split(";").filter(Boolean) : [],
    sponsorshipType: parts[12] || undefined,
  };
});
